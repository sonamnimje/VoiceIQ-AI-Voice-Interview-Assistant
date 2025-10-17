from fastapi import FastAPI, Request, HTTPException, Body, UploadFile, File, Form, status
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, Response
from fastapi.websockets import WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
import re
import asyncio
import json
import os
import tempfile
from pathlib import Path
import logging
import sqlite3
import csv
import socketio
import uvicorn
from typing import List, Dict, Any, Optional
from voice_processor import get_or_create_session, InterviewSession

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import existing modules
from db_utils import (
    init_db, add_user, save_dashboard_stats, update_user_profile,
    get_dashboard_stats, save_transcript, get_transcripts,
    change_user_password, get_user_language, update_user_language, clear_transcripts,
    # New enhanced functions
    start_interview_session, end_interview_session, add_interview_question, save_user_response,
    save_transcript_enhanced, get_interview_session, get_user_interview_history,
    get_dashboard_stats_enhanced, save_interview_analytics, update_dashboard_stats_after_interview, get_connection
)

# Import new advanced features
from voice_processor import get_or_create_session as get_voice_session
from resume_processor import ResumeProcessor
from llm_feedback import feedback_engine
from ai_interview_analyzer import ai_analyzer, AnalysisType
from interview_modes import InterviewModeManager, InterviewMode

# Remove feedback imports
# from llm_feedback import feedback_engine
# Remove feedback router import and inclusion
# from feedback_routes import router as feedback_router
# app.include_router(feedback_router)

# Remove feedback functions from db_utils import
from db_utils import (
    init_db, add_user, save_dashboard_stats, update_user_profile,
    get_dashboard_stats, save_transcript, get_transcripts,
    change_user_password, get_user_language, update_user_language, clear_transcripts,
    start_interview_session, end_interview_session, add_interview_question, save_user_response,
    save_transcript_enhanced, get_interview_session, get_user_interview_history,
    get_dashboard_stats_enhanced, save_interview_analytics, update_dashboard_stats_after_interview, get_connection
)

def map_interview_mode(frontend_mode: str) -> str:
    """Map frontend interview mode names to backend mode names"""
    mode_mapping = {
        "technical": "tech",
        "behavioral": "behavioral", 
        "mixed": "hr",  # Use HR mode for mixed interviews
        "practice": "hr",  # Use HR mode for practice
        "hr": "hr",
        "tech": "tech",
        "puzzle": "puzzle",
        "case_study": "case_study",
        "system_design": "system_design"
    }
    return mode_mapping.get(frontend_mode, "hr")  # Default to HR mode

# Initialize FastAPI app
app = FastAPI()

# Initialize interview mode manager
interview_mode_manager = InterviewModeManager()

# Initialize resume processor
resume_processor = ResumeProcessor()


class NormalizePathMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.scope.get("path", "")
        normalized = re.sub(r"/+", "/", path) if path else path
        if normalized != path:
            request.scope["path"] = normalized
        return await call_next(request)

# Initialize Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["*"]
)

# Wrap the FastAPI app with Socket.IO
socket_app = socketio.ASGIApp(sio, app)

app.add_middleware(NormalizePathMiddleware)

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25
)

# Create ASGI app with Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# Note: Removed HTTP middleware to avoid interference with WebSocket connections

# Export the socket_app as the main app for uvicorn
# Note: We need to use socket_app for uvicorn but keep app for FastAPI routes

from db_utils import init_db
import os

# Import configuration first to set up paths
from config import DATABASE_PATH

# Initialize database
init_db()

print(f"Backend started!")
print(f"Database file: {DATABASE_PATH}")
print(f"Database exists: {os.path.exists(DATABASE_PATH)}")

# Explicit global CORS preflight handler to ensure OPTIONS requests never 502
@app.options("/{rest_of_path:path}")
async def cors_preflight_handler(rest_of_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*, Authorization, Content-Type",
            "Access-Control-Max-Age": "86400",
        },
    )

@app.get("/")
def root():
    import os
    db_path = os.path.abspath("database.db")
    return {
        "message": "API is running!", 
        "database_file": db_path,
        "database_exists": os.path.exists(db_path),
        "socketio_status": "enabled",
        "socketio_endpoint": "/socket.io/"
    }


@app.get("/api/health")
async def api_health():
    """Simple health check endpoint for monitoring/deploy checks"""
    return {"status": "ok"}

@app.post("/save_dashboard_stats")
async def api_save_dashboard_stats(request: Request):
    data = await request.json()
    print("Received data for /save_dashboard_stats:", data)  # Log incoming data
    name = data.get("name")
    email = data.get("email")
    interviews_completed = data.get("interviewsCompleted")
    avg_feedback_score = data.get("avgFeedbackScore")
    last_interview_date = data.get("lastInterviewDate")
    if not name or not email:
        print("Missing name or email")  # Log missing fields
        return JSONResponse({"success": False, "error": "Missing name or email"}, status_code=400)
    try:
        save_dashboard_stats(name, email, interviews_completed, avg_feedback_score, last_interview_date)
        print("Stats saved successfully")  # Log success
        return {"success": True}
    except Exception as e:
        print("Exception in /save_dashboard_stats:", str(e))  # Log exception
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/add_user")
async def api_add_user(request: Request):
    data = await request.json()
    required_fields = ["email", "username", "password"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return JSONResponse({"error": f"Missing fields: {', '.join(missing)}"}, status_code=400)
    gmail = data.get("gmail")
    try:
        add_user(
            email=data.get("email"),
            username=data.get("username"),
            password=data.get("password"),
            gmail=gmail
        )
        return {"message": "User added successfully"}
    except Exception as e:
        if "UNIQUE constraint failed: users.email" in str(e):
            return JSONResponse({"error": "This email address is already registered."}, status_code=400)
        if "UNIQUE constraint failed: users.username" in str(e):
            return JSONResponse({"error": "This username is already registered."}, status_code=400)
        if "UNIQUE constraint failed: users.gmail" in str(e):
            return JSONResponse({"error": "This Gmail address is already registered."}, status_code=400)
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/signup")
def signup(user: dict):
    # Use email as gmail since the database requires gmail to be NOT NULL
    gmail = user.get("gmail") or user.get("email")
    
    # Ensure gmail is not None or empty
    if not gmail:
        raise HTTPException(status_code=400, detail="Email address is required")
    
    # Check if user already exists
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE email=? OR gmail=? OR username=?",
        (user["email"], gmail, user["username"])
    )
    existing_user = cursor.fetchone()
    conn.close()
    
    if existing_user:
        # Check which field is causing the conflict
        if existing_user[4] == user["email"]:  # email column
            raise HTTPException(status_code=400, detail="An account with this email address already exists")
        elif existing_user[3] == gmail:  # gmail column
            raise HTTPException(status_code=400, detail="An account with this email address already exists")
        elif existing_user[2] == user["username"]:  # username column
            raise HTTPException(status_code=400, detail="This username is already taken")
        else:
            raise HTTPException(status_code=400, detail="User with this email or username already exists")
    
    try:
        add_user(
            email=user["email"],
            username=user["username"],
            password=user["password"],
            gmail=gmail
        )
        return {"message": "User created successfully"}
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed: users.gmail" in str(e):
            raise HTTPException(status_code=400, detail="An account with this email address already exists")
        elif "NOT NULL constraint failed: users.gmail" in str(e):
            raise HTTPException(status_code=400, detail="Email address is required")
        else:
            raise HTTPException(status_code=400, detail="Database error occurred")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# New login route
@app.post("/login")
async def login(request: Request):
    data = await request.json()
    user_or_email = data.get("userOrEmail")
    password = data.get("password")
    if not user_or_email or not password:
        return JSONResponse({"error": "Missing credentials"}, status_code=400)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE (username=? OR email=?) AND password=?",
        (user_or_email, user_or_email, password)
    )
    user = cursor.fetchone()
    conn.close()
    if user:
        # Return user email so frontend can store it
        # user[4] is the email column, but if it's None, use the login input
        user_email = user[4] if user[4] else user_or_email
        return {"message": "Login successful", "email": user_email}
    else:
        return JSONResponse({"error": "Invalid username/email or password"}, status_code=401)

@app.get("/profile")
async def get_profile(user_or_email: str):
    conn = get_connection()
    cursor = conn.cursor()
    # Try to fetch new fields, fallback if not present
    try:
        cursor.execute(
            "SELECT name, username, email, phone, address, profile_pic, role, created_at FROM users WHERE username=? OR email=?",
            (user_or_email, user_or_email)
        )
        user = cursor.fetchone()
        if user:
            return {
                "name": user[0],
                "username": user[1],
                "email": user[2],
                "phone": user[3],
                "address": user[4],
                "profile_pic": user[5],
                "role": user[6] or "User"
                # 'created_at' removed
            }
    except Exception:
        # Fallback to old fields if new ones are missing
        cursor.execute(
            "SELECT name, username, email, phone, address FROM users WHERE username=? OR email=?",
            (user_or_email, user_or_email)
        )
        user = cursor.fetchone()
        if user:
            return {
                "name": user[0],
                "username": user[1],
                "email": user[2],
                "phone": user[3],
                "address": user[4]
            }
    conn.close()
    return JSONResponse({"error": "User not found"}, status_code=404)

# Simple question banks for each role
ROLE_QUESTIONS = {
    "Software Engineer": [
        "What is a REST API?",
        "Explain the difference between SQL and NoSQL databases.",
        "What is the difference between process and thread?",
        "How does garbage collection work in Python/Java?",
        "What is the difference between HTTP and HTTPS?"
    ],
    "Data Scientist": [
        "What is the difference between supervised and unsupervised learning?",
        "How do you handle missing data in a dataset?",
        "Explain the bias-variance tradeoff.",
        "What is cross-validation and why is it important?",
        "How would you evaluate a machine learning model?"
    ],
    "Product Manager": [
        "How do you prioritize features in a product roadmap?",
        "What metrics would you track to measure the success of a new feature?",
        "How do you handle disagreements between engineering and design teams?",
        "What's your approach to gathering customer requirements?",
        "How do you decide when to build a feature in-house vs using a third-party solution?"
    ]
}

@app.post("/api/interview/generate-question")
async def generate_question(request: Request):
    """Generate a random interview question based on role"""
    try:
        data = await request.json()
        role = data.get("role", "Software Engineer")  # Default to Software Engineer
        
        # Get questions for the specified role, or use all questions if role not found
        questions = ROLE_QUESTIONS.get(role, [])
        if not questions:
            # If role not found, use all questions
            all_questions = [q for qs in ROLE_QUESTIONS.values() for q in qs]
            questions = all_questions or ["Tell me about yourself."]  # Fallback question
        
        # Select a random question
        import random
        question = random.choice(questions)
        
        return {
            "success": True,
            "question": question,
            "role": role,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating question: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Failed to generate question"}
        )

# Simple question banks for each role
ROLE_QUESTIONS = {
    "Software Engineer": [
        "What is a REST API?",
        "Explain the concept of OOP.",
        "How do you handle version control?",
        "Describe a challenging bug you fixed.",
        "What is your experience with databases?"
    ],
    "Data Scientist": [
        "What is overfitting in machine learning?",
        "Explain the difference between supervised and unsupervised learning.",
        "How do you handle missing data?",
        "Describe a data project you worked on.",
        "What is regularization?"
    ],
    "Product Manager": [
        "How do you prioritize product features?",
        "Describe a time you managed a conflict in your team.",
        "What metrics do you track for product success?",
        "How do you gather user feedback?",
        "Explain the product lifecycle."
    ],
    # Add more roles as needed
}

import random

def mock_ai_evaluate(answer):
    # Mock scoring: random score and simple feedback
    score = round(random.uniform(3.0, 5.0), 1)
    feedbacks = [
        "Good answer, but could be more detailed.",
        "Great explanation!",
        "Try to give more examples.",
        "Well structured response.",
        "Consider mentioning challenges faced."
    ]
    feedback = random.choice(feedbacks)
    return score, feedback

@app.post("/api/interview/ask")
async def interview_ask(data: dict = Body(...)):
    user_answer = data.get("answer", "")
    answer_count = data.get("answerCount", 0)
    role = data.get("role", "Software Engineer")
    questions = ROLE_QUESTIONS.get(role, ROLE_QUESTIONS["Software Engineer"])
    if answer_count < len(questions):
        next_question = questions[answer_count]
    else:
        next_question = "Thank you for completing the interview!"
    score, feedback = mock_ai_evaluate(user_answer) if user_answer else (None, None)
    return {
        "nextQuestion": next_question,
        "score": score,
        "feedback": feedback
    }

@app.get("/dashboard_stats")
async def api_get_dashboard_stats(email: str):
    stats = get_dashboard_stats(email)
    if stats:
        return stats
    # Return default stats if none exist
    return {
        "interviewsCompleted": 0,
        "avgFeedbackScore": 0,
        "lastInterviewDate": "No interviews yet"
    }

@app.get("/api/dashboard/stats/{email}")
async def api_get_dashboard_stats_with_prefix(email: str):
    """Get dashboard stats with /api/ prefix for frontend compatibility"""
    try:
        stats = get_dashboard_stats_enhanced(email)
        if stats:
            return {
                "success": True,
                "stats": stats
            }
        
        # Return default stats if none exist
        return {
            "success": True,
            "stats": {
                "interviewsCompleted": 0,
                "avgFeedbackScore": 0,
                "lastInterviewDate": "No interviews yet",
                "totalQuestions": 0,
                "totalResponses": 0,
                "averageResponseTime": 0,
                "improvementTrend": "stable"
            }
        }
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.get("/api/interview/history/{email}")
async def api_get_interview_history_with_prefix(email: str, limit: int = 5):
    """Get interview history with /api/ prefix for frontend compatibility"""
    try:
        history = get_user_interview_history(email, limit)
        if history:
            return {
                "success": True,
                "history": history,
                "total": len(history)
            }
        
        # Return empty history if none exist
        return {
            "success": True,
            "history": [],
            "total": 0
        }
    except Exception as e:
        logger.error(f"Error getting interview history: {str(e)}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)



@app.get("/api/transcripts")
async def api_get_transcripts_with_prefix(email: str):
    """Get transcripts with /api/ prefix for frontend compatibility"""
    import json
    transcripts = get_transcripts(email)
    # Parse JSON data field for each transcript if it's a string
    for t in transcripts:
        try:
            if isinstance(t["data"], str):
                t["data"] = json.loads(t["data"])
        except Exception:
            pass
    return {"transcripts": transcripts}

@app.get("/all_transcripts")
async def api_get_all_transcripts():
    """Get all transcripts for debugging purposes"""
    import sqlite3
    import json
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT session_id, user_email, transcript_data, created_at 
            FROM transcripts 
            ORDER BY created_at DESC 
            LIMIT 20
        """)
        rows = cursor.fetchall()
        
        transcripts = []
        for row in rows:
            transcript = {
                "sessionId": row[0],
                "userEmail": row[1],
                "createdAt": row[3]
            }
            try:
                transcript["data"] = json.loads(row[2])
            except:
                transcript["data"] = row[2]
            transcripts.append(transcript)
        
        return {"transcripts": transcripts}
    finally:
        conn.close()

@app.post("/transcripts")
async def api_save_transcript(request: Request):
    data = await request.json()
    email = data.get("email")
    session_id = data.get("session_id")
    transcript_data = data.get("data")
    if not (email and session_id and transcript_data):
        return JSONResponse({"error": "Missing required fields"}, status_code=400)
    try:
        import json
        save_transcript(email, session_id, json.dumps(transcript_data))
        return {"success": True}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/download_reports")
async def download_reports(email: str):
    if not email:
        return JSONResponse({"error": "Email is required."}, status_code=400)
    from db_utils import get_transcripts
    import os
    transcripts = get_transcripts(email)
    if not transcripts:
        return JSONResponse({"error": "No transcripts found for this user."}, status_code=404)
    # Create a temporary CSV file
    with tempfile.NamedTemporaryFile(delete=False, mode='w', newline='', suffix='.csv') as tmpfile:
        fieldnames = ["sessionId", "data", "createdAt"]
        writer = csv.DictWriter(tmpfile, fieldnames=fieldnames)
        writer.writeheader()
        for t in transcripts:
            writer.writerow(t)
        tmpfile_path = tmpfile.name
    # Return the file as a download
    response = FileResponse(tmpfile_path, filename=f"{email}_reports.csv", media_type="text/csv")
    # Optionally, schedule file deletion after response (not handled here)
    return response

@app.post("/change_password")
async def change_password(request: Request):
    data = await request.json()
    email = data.get("email")
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")
    
    if not all([email, current_password, new_password]):
        return JSONResponse({"success": False, "error": "Missing required fields"}, status_code=400)
    
    try:
        result = change_user_password(email, current_password, new_password)
        if result:
            return {"success": True, "message": "Password changed successfully"}
        else:
            return JSONResponse({"success": False, "error": "Current password is incorrect or user not found"}, status_code=400)
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=400)

@app.post("/forgot_password")
async def forgot_password(request: Request):
    """Request password reset - sends reset token to email"""
    data = await request.json()
    email = data.get("email")
    
    if not email:
        return JSONResponse({"success": False, "error": "Email is required"}, status_code=400)
    
    try:
        # Check if user exists
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ? OR gmail = ?", (email, email))
        user = cursor.fetchone()
        conn.close()

        if not user:
            return JSONResponse({"success": False, "error": "No account found with this email"}, status_code=404)

        # Generate reset token
        import secrets
        import hashlib
        from datetime import datetime, timedelta

        reset_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
        expires_at = (datetime.now() + timedelta(hours=1)).isoformat()

        # Store reset token in database
        conn = get_connection()
        cursor = conn.cursor()
        
        # Create password_resets table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Store the reset token
        cursor.execute(
            "INSERT INTO password_resets (email, token_hash, expires_at) VALUES (?, ?, ?)",
            (email, token_hash, expires_at)
        )
        conn.commit()
        conn.close()
        
        # In a real application, you would send an email here
        # For now, we'll return the token in the response (for development)
        return {
            "success": True, 
            "message": "Password reset link sent to your email",
            "reset_token": reset_token,  # Remove this in production
            "expires_at": expires_at
        }
        
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/reset_password")
async def reset_password(request: Request):
    """Reset password using token"""
    data = await request.json()
    email = data.get("email")
    token = data.get("token")
    new_password = data.get("newPassword")
    
    if not all([email, token, new_password]):
        return JSONResponse({"success": False, "error": "Missing required fields"}, status_code=400)
    
    try:
        import hashlib
        from datetime import datetime
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Verify token
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, expires_at, used FROM password_resets 
            WHERE email = ? AND token_hash = ? 
            ORDER BY created_at DESC LIMIT 1
        """, (email, token_hash))
        
        reset_record = cursor.fetchone()
        
        if not reset_record:
            return JSONResponse({"success": False, "error": "Invalid or expired reset token"}, status_code=400)
        
        reset_id, expires_at, used = reset_record
        
        # Check if token is expired
        if datetime.fromisoformat(expires_at) < datetime.now():
            return JSONResponse({"success": False, "error": "Reset token has expired"}, status_code=400)
        
        # Check if token is already used
        if used:
            return JSONResponse({"success": False, "error": "Reset token has already been used"}, status_code=400)
        
        # Update password
        cursor.execute("UPDATE users SET password = ? WHERE email = ? OR gmail = ?", (new_password, email, email))
        
        # Mark token as used
        cursor.execute("UPDATE password_resets SET used = 1 WHERE id = ?", (reset_id,))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Password reset successfully"}
        
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/verify_reset_token")
async def verify_reset_token(request: Request):
    """Verify if a reset token is valid"""
    data = await request.json()
    email = data.get("email")
    token = data.get("token")
    
    if not all([email, token]):
        return JSONResponse({"success": False, "error": "Missing required fields"}, status_code=400)
    
    try:
        import hashlib
        from datetime import datetime
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT expires_at, used FROM password_resets 
            WHERE email = ? AND token_hash = ? 
            ORDER BY created_at DESC LIMIT 1
        """, (email, token_hash))
        
        reset_record = cursor.fetchone()
        conn.close()
        
        if not reset_record:
            return JSONResponse({"success": False, "error": "Invalid reset token"}, status_code=400)
        
        expires_at, used = reset_record
        
        # Check if token is expired
        if datetime.fromisoformat(expires_at) < datetime.now():
            return JSONResponse({"success": False, "error": "Reset token has expired"}, status_code=400)
        
        # Check if token is already used
        if used:
            return JSONResponse({"success": False, "error": "Reset token has already been used"}, status_code=400)
        
        return {"success": True, "message": "Token is valid"}
        
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.get("/get_language")
async def get_language(email: str):
    lang = get_user_language(email)
    if lang:
        return {"language": lang}
    return JSONResponse({"error": "User not found"}, status_code=404)

@app.post("/update_language")
async def update_language(request: Request):
    data = await request.json()
    email = data.get("email")
    language = data.get("language")
    if not email or not language:
        return JSONResponse({"success": False, "error": "Missing required fields"}, status_code=400)
    try:
        update_user_language(email, language)
        return {"success": True}
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/clear_history")
async def clear_history(request: Request):
    data = await request.json()
    email = data.get("email")
    if not email:
        return JSONResponse({"success": False, "error": "Email is required."}, status_code=400)
    try:
        clear_transcripts(email)
        return {"success": True}
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

# New advanced endpoints

@app.post("/api/voice/process")
async def process_voice_audio(request: Request):
    """Process voice audio and return transcription and analysis"""
    try:
        data = await request.json()
        session_id = data.get("session_id")
        audio_data = data.get("audio_data")  # Base64 encoded audio
        role = data.get("role", "Software Engineer")
        timestamp = data.get("timestamp", asyncio.get_event_loop().time())
        
        if not session_id or not audio_data:
            return JSONResponse({"error": "Missing session_id or audio_data"}, status_code=400)
        
        # Get or create voice session
        voice_session = get_voice_session(session_id, role)
        
        # Process audio (convert from base64 if needed)
        import base64
        audio_bytes = base64.b64decode(audio_data)
        
        # Process the audio
        result = await voice_session.process_interview_audio(audio_bytes, timestamp)
        
        return {
            "success": True,
            "transcript": result.get("transcript"),
            "audio_quality": result.get("audio_quality"),
            "session_summary": voice_session.get_session_summary()
        }
        
    except Exception as e:
        logger.error(f"Error processing voice audio: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)



@app.post("/api/llm/analyze-response")
async def analyze_response_with_llm(request: Request):
    """Analyze interview response using LLM"""
    try:
        data = await request.json()
        question = data.get("question")
        answer = data.get("answer")
        role = data.get("role", "Software Engineer")
        context = data.get("context", {})
        
        if not question or not answer:
            return JSONResponse({"error": "Missing question or answer"}, status_code=400)
        
        # Analyze with LLM
        feedback = await feedback_engine.analyze_interview_response(question, answer, role, context)
        
        return {
            "success": True,
            "feedback": feedback
        }
        
    except Exception as e:
        logger.error(f"Error analyzing response with LLM: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/llm/comprehensive-feedback")
async def get_comprehensive_feedback(request: Request):
    """Get comprehensive feedback for entire interview session"""
    try:
        data = await request.json()
        session_data = data.get("session_data", {})
        role = data.get("role", "Software Engineer")
        
        if not session_data:
            return JSONResponse({"error": "Missing session data"}, status_code=400)
        
        # Generate comprehensive feedback
        feedback = await feedback_engine.generate_comprehensive_feedback(session_data, role)
        
        return {
            "success": True,
            "feedback": feedback
        }
        
    except Exception as e:
        logger.error(f"Error generating comprehensive feedback: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/ai/interview-analysis")
async def analyze_interview_session(request: Request):
    """Comprehensive AI interview analysis with multiple analysis types"""
    try:
        data = await request.json()
        session_data = data.get("session_data", {})
        analysis_type = data.get("analysis_type", "post_interview")
        
        if not session_data:
            return JSONResponse({"error": "Missing session data"}, status_code=400)
        
        # Map analysis type string to enum
        analysis_enum = AnalysisType.POST_INTERVIEW
        if analysis_type == "real_time":
            analysis_enum = AnalysisType.REAL_TIME
        elif analysis_type == "skill_assessment":
            analysis_enum = AnalysisType.SKILL_ASSESSMENT
        elif analysis_type == "career_development":
            analysis_enum = AnalysisType.CAREER_DEVELOPMENT
        
        # Generate AI analysis
        analysis = await ai_analyzer.analyze_interview_session(session_data, analysis_enum)
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error in AI interview analysis: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/ai/real-time-feedback")
async def get_real_time_feedback(request: Request):
    """Get real-time feedback during interview"""
    try:
        data = await request.json()
        session_data = data.get("session_data", {})
        
        if not session_data:
            return JSONResponse({"error": "Missing session data"}, status_code=400)
        
        # Generate real-time feedback
        feedback = await ai_analyzer.analyze_interview_session(
            session_data, 
            AnalysisType.REAL_TIME
        )
        
        return feedback
        
    except Exception as e:
        logger.error(f"Error generating real-time feedback: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/ai/skill-assessment")
async def get_skill_assessment(request: Request):
    """Get detailed skill gap analysis and development plan"""
    try:
        data = await request.json()
        session_data = data.get("session_data", {})
        
        if not session_data:
            return JSONResponse({"error": "Missing session data"}, status_code=400)
        
        # Generate skill assessment
        assessment = await ai_analyzer.analyze_interview_session(
            session_data, 
            AnalysisType.SKILL_ASSESSMENT
        )
        
        return assessment
        
    except Exception as e:
        logger.error(f"Error generating skill assessment: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/ai/career-development")
async def get_career_development_analysis(request: Request):
    """Get career development analysis and strategic advice"""
    try:
        data = await request.json()
        session_data = data.get("session_data", {})
        
        if not session_data:
            return JSONResponse({"error": "Missing session data"}, status_code=400)
        
        # Generate career development analysis
        analysis = await ai_analyzer.analyze_interview_session(
            session_data, 
            AnalysisType.CAREER_DEVELOPMENT
        )
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error generating career development analysis: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/ai/quick-analysis")
async def get_quick_analysis(request: Request):
    """Get quick analysis for immediate feedback"""
    try:
        data = await request.json()
        question = data.get("question", "")
        answer = data.get("answer", "")
        role = data.get("role", "Software Engineer")
        context = data.get("context", {})
        
        if not question or not answer:
            return JSONResponse({"error": "Missing question or answer"}, status_code=400)
        
        # Create minimal session data for quick analysis
        session_data = {
            "role": role,
            "responses": [{"question": question, "answer": answer}],
            "context": context
        }
        
        # Generate quick analysis
        analysis = await ai_analyzer.analyze_interview_session(
            session_data, 
            AnalysisType.REAL_TIME
        )
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error generating quick analysis: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/ai/batch-analysis")
async def batch_analyze_interviews(request: Request):
    """Analyze multiple interview sessions in batch"""
    try:
        data = await request.json()
        sessions = data.get("sessions", [])
        analysis_type = data.get("analysis_type", "post_interview")
        
        if not sessions or not isinstance(sessions, list):
            return JSONResponse({"error": "Invalid sessions data"}, status_code=400)
        
        # Map analysis type
        analysis_enum = AnalysisType.POST_INTERVIEW
        if analysis_type == "skill_assessment":
            analysis_enum = AnalysisType.SKILL_ASSESSMENT
        elif analysis_type == "career_development":
            analysis_enum = AnalysisType.CAREER_DEVELOPMENT
        
        # Process each session
        results = []
        for session in sessions:
            try:
                analysis = await ai_analyzer.analyze_interview_session(session, analysis_enum)
                results.append({
                    "session_id": session.get("session_id", "unknown"),
                    "success": True,
                    "analysis": analysis
                })
            except Exception as e:
                results.append({
                    "session_id": session.get("session_id", "unknown"),
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "total_sessions": len(sessions),
            "successful_analyses": len([r for r in results if r["success"]]),
            "failed_analyses": len([r for r in results if not r["success"]]),
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/resume/upload")
async def upload_and_process_resume(
    file: UploadFile = File(...),
    role: str = Form(...),
    user_email: str = Form(...)
):
    """Upload and process resume"""
    try:
        logger.info(f"Processing resume upload for user: {user_email}, role: {role}, filename: {file.filename}")
        
        # Validate file type
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in allowed_extensions:
            return JSONResponse({"error": f"Unsupported file type: {file_extension}. Supported types: {', '.join(allowed_extensions)}"}, status_code=400)
        
        # Validate file size (5MB limit)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:  # 5MB
            return JSONResponse({"error": "File size exceeds 5MB limit"}, status_code=400)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Process resume using the ResumeProcessor instance
            logger.info(f"Processing resume file: {temp_file_path}")
            
            # Create an instance of ResumeProcessor
            processor = ResumeProcessor()
            
            # Process the resume
            result = processor.process_resume(temp_file_path)
            
            if result["success"]:
                # Match skills to role
                skill_match = processor.match_skills_to_role(
                    result["extracted_info"], role
                )

                # Calculate aggregate counts for convenience on the frontend
                skills_total_count = sum(
                    len(v) for v in result["extracted_info"].get("skills", {}).values()
                )
                skills_category_count = len(
                    [
                        1
                        for v in result["extracted_info"].get("skills", {}).values()
                        if len(v) > 0
                    ]
                )
                experience_positions_count = len(
                    result["extracted_info"].get("experience", [])
                )

                logger.info(
                    f"Resume processed successfully. Skills found: {skills_total_count} (across {skills_category_count} categories)"
                )

                return {
                    "success": True,
                    "analysis": {
                        "extracted_info": result["extracted_info"],
                        "skill_match": skill_match,
                        "skills_total_count": skills_total_count,
                        "skills_category_count": skills_category_count,
                        "experience_positions_count": experience_positions_count,
                    },
                }
            else:
                logger.error(f"Resume processing failed: {result.get('error')}")
                return JSONResponse({"error": result["error"]}, status_code=400)
                
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temp file {temp_file_path}: {cleanup_error}")
            
    except Exception as e:
        logger.error(f"Error processing resume: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/interview-modes")
async def get_interview_modes():
    """Get available interview modes"""
    try:
        modes = {}
        for mode in InterviewMode:
            config = interview_mode_manager.get_mode_config(mode.value)
            modes[mode.value] = {
                "name": config.get("name", mode.value.title()),
                "description": config.get("description", ""),
                "duration": config.get("duration", 30),
                "focus_areas": config.get("focus_areas", []),
                "scoring_criteria": config.get("scoring_criteria", [])
            }
        
        return {
            "success": True,
            "modes": modes
        }
        
    except Exception as e:
        logger.error(f"Error getting interview modes: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.options("/api/interview-modes")
async def options_interview_modes():
    """Handle CORS preflight for interview modes"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.post("/api/interview-modes/questions")
async def get_interview_questions(request: Request):
    """Get interview questions and store them in database"""
    try:
        data = await request.json()
        mode = data.get("mode", "hr")
        role = data.get("role", "Software Engineer")
        difficulty = data.get("difficulty", "medium")
        count = data.get("count", 5)
        session_id = data.get("sessionId")  # Add session_id to store questions
        
        if not session_id:
            return JSONResponse({"error": "Missing sessionId"}, status_code=400)
        
        # Get questions from interview mode manager
        questions = interview_mode_manager.get_interview_questions(mode, role, difficulty, count)
        
        # Store questions in database and get question IDs
        stored_questions = []
        for i, question in enumerate(questions):
            question_id = add_interview_question(
                session_id=session_id,
                question_text=question.get("question", question) if isinstance(question, dict) else question,
                question_type=question.get("type", "text") if isinstance(question, dict) else "text",
                category=question.get("category") if isinstance(question, dict) else None,
                difficulty=difficulty
            )
            
            stored_questions.append({
                "id": question_id,
                "question": question.get("question", question) if isinstance(question, dict) else question,
                "type": question.get("type", "text") if isinstance(question, dict) else "text",
                "category": question.get("category") if isinstance(question, dict) else None,
                "difficulty": difficulty,
                "index": i
            })
        
        # Update session with total questions count
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE interview_sessions 
            SET total_questions = ?, current_question_index = 0
            WHERE session_id = ?
        """, (len(stored_questions), session_id))
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "questions": stored_questions,
            "config": {
                "mode": mode,
                "role": role,
                "difficulty": difficulty,
                "total_questions": len(stored_questions)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting interview questions: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/interview-modes/evaluate")
async def evaluate_interview_response(request: Request):
    """Evaluate response for specific interview mode"""
    try:
        data = await request.json()
        question = data.get("question", {})
        response = data.get("response", "")
        mode = data.get("mode", "hr")
        
        if not question or not response:
            return JSONResponse({"error": "Missing question or response"}, status_code=400)
        
        evaluation = interview_mode_manager.evaluate_response(question, response, mode)
        
        return {
            "success": True,
            "evaluation": evaluation
        }
        
    except Exception as e:
        logger.error(f"Error evaluating response: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/llm/suggest-questions")
async def suggest_questions(request: Request):
    """Get AI-suggested interview questions"""
    try:
        data = await request.json()
        role = data.get("role", "Software Engineer")
        difficulty = data.get("difficulty", "medium")
        question_type = data.get("question_type", "technical")
        
        questions = await feedback_engine.suggest_questions(role, difficulty, question_type)
        
        return {
            "success": True,
            "questions": questions
        }
        
    except Exception as e:
        logger.error(f"Error suggesting questions: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

# WebSocket connection handler
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    active_connections[client_id] = websocket
    logger.info(f"New WebSocket connection: {client_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received from {client_id}: {data}")
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {client_id}")
        if client_id in active_connections:
            del active_connections[client_id]

# Socket.IO event handlers for voice interview
@sio.event
async def connect(sid, environ):
    """Handle Socket.IO client connection"""
    logger.info(f"Socket.IO client connected: {sid}")
    await sio.emit('connect_response', {'status': 'connected', 'sid': sid}, room=sid)

@sio.event
async def disconnect(sid):
    """Handle Socket.IO client disconnection"""
    logger.info(f"Socket.IO client disconnected: {sid}")

@sio.event
async def test(sid, data):
    """Handle test event from client"""
    logger.info(f"Test event received from {sid}: {data}")
    await sio.emit('test_response', {'status': 'test_success', 'data': data}, room=sid)

@sio.event
async def voice(sid, data):
    """Handle voice data from client"""
    try:
        logger.info(f"Received voice data from client {sid}")
        session_id = data.get("session_id")
        role = data.get("role", "Software Engineer")
        audio_data = data.get("audio_data")
        
        logger.info(f"Session ID: {session_id}, Role: {role}, Audio data length: {len(audio_data) if audio_data else 0}")
        
        if not session_id or not audio_data:
            logger.error("Missing session_id or audio_data")
            await sio.emit('error', {'message': 'Missing session_id or audio_data'}, room=sid)
            return
        
        # Decode base64 audio data
        import base64
        try:
            audio_bytes = base64.b64decode(audio_data)
            logger.info(f"Decoded audio data size: {len(audio_bytes)} bytes")
        except Exception as e:
            logger.error(f"Failed to decode base64 audio data: {e}")
            await sio.emit('error', {'message': 'Invalid audio data format'}, room=sid)
            return
        
        # Process voice data
        try:
            # Get or create voice session
            voice_session = get_or_create_session(session_id, role)
            
            # Process the audio data
            result = await voice_session.process_interview_audio(audio_bytes, asyncio.get_event_loop().time())
            
            logger.info(f"Voice processing result: {result}")
            
            # Prepare response data
            response_data = {}
            if result.get('transcript'):
                response_data['transcript'] = result['transcript']
            if result.get('audio_quality'):
                response_data['audio_quality'] = result['audio_quality']
            
            # Send results back to client
            await sio.emit('voice_result', response_data, room=sid)
            logger.info("Voice result sent to client")
            
        except Exception as e:
            logger.error(f"Error in voice processing: {str(e)}", exc_info=True)
            await sio.emit('error', {
                'message': 'Error processing voice data',
                'details': str(e)
            }, room=sid)
        
    except Exception as e:
        logger.error(f"Error processing voice data: {str(e)}", exc_info=True)
        await sio.emit('error', {
            'message': 'Failed to process voice data',
            'details': str(e)
        }, room=sid)

# Remove feedback event
# @sio.event
# async def feedback(sid, data):
#     ...

# New API endpoints for enhanced interview functionality

@app.post("/api/interview/start")
async def start_interview(request: Request):
    """Start a new interview session"""
    try:
        data = await request.json()
        user_email = data.get("userEmail")
        role = data.get("role")
        interview_mode = data.get("interviewMode", "standard")
        
        if not user_email or not role:
            return JSONResponse({"error": "Missing userEmail or role"}, status_code=400)
        
        # Start a new interview session
        session_id = start_interview_session(user_email, role, interview_mode)
        
        if not session_id:
            return JSONResponse({"error": "Failed to create interview session"}, status_code=500)
            
        logger.info(f"Started new interview session: {session_id} for user: {user_email}, role: {role}")
        
        return {
            "success": True,
            "sessionId": session_id,
            "message": "Interview session started successfully",
            "sessionData": {
                "userEmail": user_email,
                "role": role,
                "interviewMode": interview_mode,
                "startTime": datetime.now().isoformat(),
                "status": "active"
            }
        }
    except Exception as e:
        logger.error(f"Error starting interview: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/interview/create-session")
async def create_interview_session(request: Request):
    """Create a new interview session with advanced configuration"""
    try:
        data = await request.json()
        user_email = data.get("userEmail")
        interview_type = data.get("type", "mixed")
        role = data.get("role", "Software Engineer")
        difficulty = data.get("difficulty", "medium")
        duration = data.get("duration", 30)
        features = data.get("features", [])
        
        if not user_email:
            return JSONResponse({"error": "Missing userEmail"}, status_code=400)
        
        # Map interview type to interview mode
        interview_mode = map_interview_mode(interview_type)
        
        # Create session with enhanced configuration
        session_id = start_interview_session(user_email, role, interview_mode)
        
        # Store additional configuration in session metadata
        session_config = {
            "type": interview_type,
            "difficulty": difficulty,
            "duration": duration,
            "features": features,
            "created_at": datetime.now().isoformat()
        }
        
        # You could store this in a separate table or extend the existing session
        # For now, we'll return it in the response
        
        return {
            "success": True,
            "sessionId": session_id,
            "config": session_config,
            "message": "Interview session created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating interview session: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/interview/create-session-with-resume")
async def create_interview_session_with_resume(
    resume: UploadFile = File(...),
    config: str = Form(...)
):
    """Create a new interview session with resume upload"""
    try:
        # Parse the config JSON string
        interview_config = json.loads(config)
        
        # Extract session data
        interview_type = interview_config.get("type", "hr")
        role = interview_config.get("role", "Software Engineer")
        difficulty = interview_config.get("difficulty", "medium")
        duration = interview_config.get("duration", 30)
        user_email = interview_config.get("userEmail")
        
        if not user_email:
            return JSONResponse({"error": "User email is required"}, status_code=400)
        
        # Process resume if provided
        resume_analysis = None
        if resume:
            try:
                # Save uploaded file temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix=Path(resume.filename).suffix) as temp_file:
                    content = await resume.read()
                    temp_file.write(content)
                    temp_file_path = temp_file.name
                
                try:
                    # Process resume
                    result = resume_processor.process_resume(temp_file_path)
                    
                    if result["success"]:
                        # Match skills to role
                        skill_match = resume_processor.match_skills_to_role(
                            result["extracted_info"], role
                        )
                        
                        resume_analysis = {
                            "extracted_info": result["extracted_info"],
                            "skill_match": skill_match
                        }
                        
                        logger.info(f"Resume processed successfully for user: {user_email}")
                    else:
                        logger.warning(f"Resume processing failed: {result.get('error', 'Unknown error')}")
                        
                finally:
                    # Clean up temporary file
                    os.unlink(temp_file_path)
                    
            except Exception as e:
                logger.error(f"Error processing resume: {e}")
                # Continue without resume analysis
        
        # Map interview type to interview mode
        interview_mode = map_interview_mode(interview_type)
        
        # Create session in database
        session_id = start_interview_session(user_email, role, interview_mode)
        
        # Store additional configuration in session metadata
        session_config = {
            "type": interview_type,
            "difficulty": difficulty,
            "duration": duration,
            "resume_analysis": resume_analysis,
            "created_at": datetime.now().isoformat()
        }
        
        if session_id:
            return {
                "success": True,
                "sessionId": session_id,
                "config": session_config,
                "message": "Interview session created successfully",
                "resumeProcessed": resume_analysis is not None
            }
        else:
            return JSONResponse({"error": "Failed to create interview session"}, status_code=500)
            
    except Exception as e:
        logger.error(f"Error creating interview session with resume: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/interview/end")
async def end_interview(request: Request):
    """End an interview session"""
    try:
        data = await request.json()
        session_id = data.get("sessionId")
        
        if not session_id:
            return JSONResponse({"error": "Missing sessionId"}, status_code=400)
        
        success = end_interview_session(session_id)
        
        if success:
            return {"success": True, "message": "Interview session ended successfully"}
        else:
            return JSONResponse({"error": "Failed to end interview session"}, status_code=500)
    except Exception as e:
        logger.error(f"Error ending interview: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/interview/question")
async def add_question(request: Request):
    """Add a question to an interview session"""
    try:
        data = await request.json()
        session_id = data.get("sessionId")
        question_text = data.get("questionText")
        question_type = data.get("questionType", "text")
        category = data.get("category")
        difficulty = data.get("difficulty", "medium")
        
        if not session_id or not question_text:
            return JSONResponse({"error": "Missing sessionId or questionText"}, status_code=400)
        
        question_id = add_interview_question(session_id, question_text, question_type, category, difficulty)
        
        return {
            "success": True,
            "questionId": question_id,
            "message": "Question added successfully"
        }
    except Exception as e:
        logger.error(f"Error adding question: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/interview/response")
async def save_response(request: Request):
    """Save user response to a question with enhanced data storage"""
    try:
        data = await request.json()
        session_id = data.get("sessionId")
        question_index = data.get("questionIndex")
        question_text = data.get("question")
        user_answer = data.get("answer") or data.get("userAnswer")
        audio_blob = data.get("audioBlob")
        response_duration = data.get("responseDuration")
        confidence_score = data.get("confidenceScore")
        question_id = data.get("questionId")  # Add question_id for proper association
        
        if not session_id or question_index is None or not user_answer:
            return JSONResponse({"error": "Missing required fields"}, status_code=400)
        
        # If question_id is not provided, try to find it by session_id and question_index
        if not question_id:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id FROM interview_questions 
                WHERE session_id = ? AND question_index = ?
                ORDER BY id ASC
            """, (session_id, question_index + 1))  # question_index is 0-based, database is 1-based
            result = cursor.fetchone()
            conn.close()
            
            if result:
                question_id = result[0]
            else:
                # If question not found, create a placeholder question
                question_id = add_interview_question(
                    session_id=session_id,
                    question_text=question_text or f"Question {question_index + 1}",
                    question_type="text",
                    category=None,
                    difficulty="medium"
                )
        
        # Save audio file if provided
        audio_file_path = None
        if audio_blob:
            try:
                # Decode base64 audio data
                import base64
                audio_data = base64.b64decode(audio_blob.split(',')[1])
                
                # Create audio directory if it doesn't exist
                audio_dir = f"audio_responses/{session_id}"
                os.makedirs(audio_dir, exist_ok=True)
                
                # Save audio file
                audio_file_path = f"{audio_dir}/response_{question_index}_{int(datetime.now().timestamp())}.wav"
                with open(audio_file_path, "wb") as f:
                    f.write(audio_data)
                    
            except Exception as e:
                logger.error(f"Error saving audio file: {e}")
                audio_file_path = None
        
        # Save response to database
        response_id = save_user_response(
            session_id=session_id,
            question_id=question_id,
            user_answer=user_answer,
            audio_file_path=audio_file_path,
            response_duration=response_duration,
            confidence_score=confidence_score
        )
        
        # Update session progress
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE interview_sessions 
            SET current_question_index = ?, questions_answered = questions_answered + 1
            WHERE session_id = ?
        """, (question_index + 1, session_id))
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "responseId": response_id,
            "questionId": question_id,
            "audioFilePath": audio_file_path,
            "message": "Response saved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error saving response: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/transcript/save")
async def save_transcript_api(request: Request):
    """Save comprehensive transcript data with enhanced metadata"""
    try:
        data = await request.json()
        session_id = data.get("sessionId")
        user_email = data.get("userEmail")
        transcript_data = data.get("transcriptData")
        raw_audio_path = data.get("rawAudioPath")
        processed_audio_path = data.get("processedAudioPath")
        word_timestamps = data.get("wordTimestamps")
        confidence_scores = data.get("confidenceScores")
        
        if not session_id or not user_email or not transcript_data:
            return JSONResponse({"error": "Missing required fields"}, status_code=400)
        
        # Save enhanced transcript
        transcript_id = save_transcript_enhanced(
            session_id=session_id,
            user_email=user_email,
            transcript_data=transcript_data,
            raw_audio_path=raw_audio_path,
            processed_audio_path=processed_audio_path,
            word_timestamps=word_timestamps,
            confidence_scores=confidence_scores
        )
        
        # Update session with transcript info
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE interview_sessions 
            SET session_data = json_set(
                COALESCE(session_data, '{}'),
                '$.transcript_id', ?,
                '$.transcript_saved_at', ?
            )
            WHERE session_id = ?
        """, (transcript_id, datetime.now().isoformat(), session_id))
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "transcriptId": transcript_id,
            "message": "Transcript saved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error saving transcript: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/analytics/save")
async def save_analytics(request: Request):
    """Save interview analytics data"""
    try:
        data = await request.json()
        session_id = data.get("sessionId")
        user_email = data.get("userEmail")
        question_analytics = data.get("questionAnalytics")
        voice_metrics = data.get("voiceMetrics")
        response_patterns = data.get("responsePatterns")
        
        if not session_id or not user_email:
            return JSONResponse({"error": "Missing required fields"}, status_code=400)
        
        analytics_id = save_interview_analytics(
            session_id, user_email, question_analytics,
            voice_metrics, response_patterns
        )
        
        return {
            "success": True,
            "analyticsId": analytics_id,
            "message": "Analytics saved successfully"
        }
    except Exception as e:
        logger.error(f"Error saving analytics: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/profile")
async def get_profile_api(email: str):
    """Get user profile by email"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Try to fetch profile with basic fields first
        cursor.execute("""
            SELECT name, username, email, phone, address 
            FROM users WHERE email=?
        """, (email,))
        user = cursor.fetchone()
        
        if user:
            profile_data = {
                "name": user[0] or "",
                "username": user[1] or "",
                "email": user[2] or "",
                "phone": user[3] or "",
                "location": user[4] or "",  # Using address as location
                "bio": "Passionate professional with expertise in various domains.",
                "skills": ["Communication", "Problem Solving", "Team Work"],
                "experience": "2+ years",
                "education": "Bachelor's Degree",
                "linkedin": "",
                "github": "",
                "role": "User"
            }
            conn.close()
            return profile_data
        else:
            conn.close()
            return JSONResponse({"error": "User not found"}, status_code=404)
            
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/profile/update")
async def update_profile_api(request: Request):
    """Update user profile"""
    try:
        data = await request.json()
        email = data.get("email")
        name = data.get("name")
        username = data.get("username")
        phone = data.get("phone")
        location = data.get("location")  # Frontend sends location, we'll map to address
        bio = data.get("bio")
        skills = data.get("skills", [])
        experience = data.get("experience")
        education = data.get("education")
        linkedin = data.get("linkedin")
        github = data.get("github")

        if not email or not name:
            return JSONResponse({"success": False, "error": "Missing required fields"}, status_code=400)
        
        # For now, we'll update the basic fields that exist in our database
        # The additional fields (bio, skills, etc.) would need database schema updates
        try:
            update_user_profile(
                email=email,
                name=name,
                username=username or name,  # Use name as username if not provided
                phone=phone or "",
                address=location or "",  # Map location to address field
                profile_pic=None
            )
            return {"success": True, "message": "Profile updated successfully"}
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            return JSONResponse({"success": False, "error": str(e)}, status_code=500)
            
    except Exception as e:
        logger.error(f"Error in profile update API: {str(e)}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/update_profile")
async def update_profile(request: Request):
    data = await request.json()
    email = data.get("email")
    name = data.get("name")
    username = data.get("username")
    phone = data.get("phone")
    address = data.get("address")
    profile_pic = data.get("profile_pic")  # Optional

    if not all([email, name, username, phone, address]):
        return JSONResponse({"success": False, "error": "Missing required fields"}, status_code=400)
    try:
        update_user_profile(email, name, username, phone, address, profile_pic)
        return {"success": True}
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.get("/api/export/preview")
async def export_preview(email: str):
    """Get data export preview with counts and sizes"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get interview count
        cursor.execute("SELECT COUNT(*) FROM interview_sessions WHERE user_email = ?", (email,))
        interview_count = cursor.fetchone()[0]
        
        # Get feedback count
        cursor.execute("SELECT COUNT(*) FROM feedback WHERE user_email = ?", (email,))
        feedback_count = cursor.fetchone()[0]
        
        # Get transcript count
        cursor.execute("SELECT COUNT(*) FROM transcripts WHERE user_email = ?", (email,))
        transcript_count = cursor.fetchone()[0]
        
        # Get analytics count
        cursor.execute("SELECT COUNT(*) FROM interview_analytics WHERE user_email = ?", (email,))
        analytics_count = cursor.fetchone()[0]
        
        conn.close()
        
        # Calculate estimated sizes (rough estimates)
        profile_size = "2 KB"
        interview_history_size = f"{interview_count * 3} KB"
        feedback_size = f"{feedback_count * 2} KB"
        transcripts_size = f"{transcript_count * 5} KB"
        analytics_size = f"{analytics_count * 2} KB"
        
        total_size = f"{interview_count * 3 + feedback_count * 2 + transcript_count * 5 + analytics_count * 2 + 2} KB"
        
        return {
            "interviewCount": interview_count,
            "feedbackCount": feedback_count,
            "transcriptCount": transcript_count,
            "analyticsCount": analytics_count,
            "profileSize": profile_size,
            "interviewHistorySize": interview_history_size,
            "feedbackSize": feedback_size,
            "transcriptsSize": transcripts_size,
            "analyticsSize": analytics_size,
            "totalSize": total_size
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/export/data")
async def export_data(request: Request):
    """Export user data in specified format"""
    try:
        data = await request.json()
        email = data.get("email")
        data_types = data.get("dataTypes", [])
        export_format = data.get("format", "json")
        
        if not email:
            return JSONResponse({"error": "Email is required"}, status_code=400)
        
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()
        
        export_data = {}
        
        # Export profile data
        if "profile" in data_types:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user_data = cursor.fetchone()
            if user_data:
                export_data["profile"] = {
                    "name": user_data[1] if len(user_data) > 1 else "",
                    "email": user_data[2] if len(user_data) > 2 else "",
                    "username": user_data[3] if len(user_data) > 3 else "",
                    "phone": user_data[5] if len(user_data) > 5 else "",
                    "address": user_data[6] if len(user_data) > 6 else "",
                    "role": user_data[7] if len(user_data) > 7 else ""
                }
        
        # Export interview history
        if "interviewHistory" in data_types:
            cursor.execute("""
                SELECT session_id, role, interview_mode, status, created_at, end_time 
                FROM interview_sessions 
                WHERE user_email = ?
                ORDER BY created_at DESC
            """, (email,))
            interviews = cursor.fetchall()
            export_data["interviewHistory"] = [
                {
                    "sessionId": row[0],
                    "role": row[1],
                    "interviewMode": row[2],
                    "status": row[3],
                    "createdAt": row[4],
                    "endTime": row[5]
                }
                for row in interviews
            ]
        
        # Export feedback
        if "feedback" in data_types:
            cursor.execute("""
                SELECT session_id, overall_score, technical_score, communication_score, 
                       problem_solving_score, confidence_score, detailed_feedback, suggestions
                FROM feedback 
                WHERE user_email = ?
                ORDER BY created_at DESC
            """, (email,))
            feedback_data = cursor.fetchall()
            export_data["feedback"] = [
                {
                    "sessionId": row[0],
                    "overallScore": row[1],
                    "technicalScore": row[2],
                    "communicationScore": row[3],
                    "problemSolvingScore": row[4],
                    "confidenceScore": row[5],
                    "detailedFeedback": row[6],
                    "suggestions": row[7]
                }
                for row in feedback_data
            ]
        
        # Export transcripts
        if "transcripts" in data_types:
            cursor.execute("""
                SELECT session_id, transcript_data, created_at
                FROM transcripts 
                WHERE user_email = ?
                ORDER BY created_at DESC
            """, (email,))
            transcripts = cursor.fetchall()
            export_data["transcripts"] = [
                {
                    "sessionId": row[0],
                    "transcriptData": row[1],
                    "createdAt": row[2]
                }
                for row in transcripts
            ]
        
        # Export analytics
        if "analytics" in data_types:
            cursor.execute("""
                SELECT session_id, question_analytics, voice_metrics, response_patterns, created_at
                FROM interview_analytics 
                WHERE user_email = ?
                ORDER BY created_at DESC
            """, (email,))
            analytics = cursor.fetchall()
            export_data["analytics"] = [
                {
                    "sessionId": row[0],
                    "questionAnalytics": row[1],
                    "voiceMetrics": row[2],
                    "responsePatterns": row[3],
                    "createdAt": row[4]
                }
                for row in analytics
            ]
        
        conn.close()
        
        # Add metadata
        export_data["metadata"] = {
            "exportDate": datetime.now().isoformat(),
            "userEmail": email,
            "dataTypes": data_types,
            "format": export_format
        }
        
        # Convert to requested format
        if export_format == "json":
            import json
            content = json.dumps(export_data, indent=2)
            content_type = "application/json"
            file_extension = "json"
        elif export_format == "csv":
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write profile data
            if "profile" in export_data:
                writer.writerow(["Profile Information"])
                for key, value in export_data["profile"].items():
                    writer.writerow([key, value])
                writer.writerow([])
            
            # Write interview history
            if "interviewHistory" in export_data:
                writer.writerow(["Interview History"])
                writer.writerow(["Session ID", "Role", "Mode", "Status", "Created", "Ended"])
                for interview in export_data["interviewHistory"]:
                    writer.writerow([
                        interview["sessionId"],
                        interview["role"],
                        interview["interviewMode"],
                        interview["status"],
                        interview["createdAt"],
                        interview["endTime"]
                    ])
                writer.writerow([])
            
            # Write feedback
            if "feedback" in export_data:
                writer.writerow(["Feedback & Evaluations"])
                writer.writerow(["Session ID", "Overall Score", "Technical", "Communication", "Problem Solving", "Confidence"])
                for feedback in export_data["feedback"]:
                    writer.writerow([
                        feedback["sessionId"],
                        feedback["overallScore"],
                        feedback["technicalScore"],
                        feedback["communicationScore"],
                        feedback["problemSolvingScore"],
                        feedback["confidenceScore"]
                    ])
                writer.writerow([])
            
            content = output.getvalue()
            content_type = "text/csv"
            file_extension = "csv"
        else:  # PDF format
            # For PDF, we'll return a simple text representation
            content = f"""
VoiceIQ Data Export
==================

Export Date: {export_data["metadata"]["exportDate"]}
User Email: {email}

Profile Information:
{'-' * 20}
{chr(10).join([f"{k}: {v}" for k, v in export_data.get("profile", {}).items()])}

Interview History:
{'-' * 20}
{chr(10).join([f"Session: {i['sessionId']} - {i['role']} ({i['status']})" for i in export_data.get("interviewHistory", [])])}

Feedback & Evaluations:
{'-' * 20}
{chr(10).join([f"Session: {f['sessionId']} - Score: {f['overallScore']}" for f in export_data.get("feedback", [])])}

Transcripts:
{'-' * 20}
{chr(10).join([f"Session: {t['sessionId']} - {len(str(t['transcriptData']))} characters" for t in export_data.get("transcripts", [])])}

Analytics:
{'-' * 20}
{chr(10).join([f"Session: {a['sessionId']} - Analytics available" for a in export_data.get("analytics", [])])}
            """
            content_type = "text/plain"
            file_extension = "txt"
        
        return Response(
            content=content,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename=voiceiq-export-{datetime.now().strftime('%Y-%m-%d')}.{file_extension}"}
        )
        
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/socketio-test")
def socketio_test():
    """Test endpoint to verify Socket.IO server is running"""
    try:
        return {
            "status": "Socket.IO server is running",
            "endpoint": "/socket.io/",
            "cors_enabled": True,
            "allowed_origins": "*",
            "server_info": {
                "async_mode": sio.async_mode,
                "cors_allowed_origins": getattr(sio, 'cors_allowed_origins', 'Not available'),
                "logger_enabled": getattr(sio, 'logger', 'Not available'),
                "engineio_logger_enabled": getattr(sio, 'engineio_logger', 'Not available'),
                "ping_timeout": getattr(sio, 'ping_timeout', 'Not available'),
                "ping_interval": getattr(sio, 'ping_interval', 'Not available')
            }
        }
    except Exception as e:
        return {
            "status": "Socket.IO server error",
            "error": str(e),
            "endpoint": "/socket.io/"
        }

@app.get("/socketio-simple-test")
def socketio_simple_test():
    """Simple test endpoint for Socket.IO"""
    return {
        "status": "ok",
        "message": "Socket.IO server is ready",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/interview/session-data/{session_id}")
async def get_interview_session_data(session_id: str):
    """Get comprehensive interview session data including questions and responses"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get session information
        cursor.execute("""
            SELECT * FROM interview_sessions WHERE session_id = ?
        """, (session_id,))
        session_data = cursor.fetchone()
        
        if not session_data:
            return JSONResponse({"error": "Session not found"}, status_code=404)
        
        # Get column names
        columns = [description[0] for description in cursor.description]
        session_dict = dict(zip(columns, session_data))
        
        # Get questions for this session
        cursor.execute("""
            SELECT * FROM interview_questions 
            WHERE session_id = ? 
            ORDER BY question_index ASC
        """, (session_id,))
        questions_data = cursor.fetchall()
        
        # Get column names for questions
        question_columns = [description[0] for description in cursor.description]
        questions = []
        for question_row in questions_data:
            question_dict = dict(zip(question_columns, question_row))
            questions.append(question_dict)
        
        # Get responses for this session
        cursor.execute("""
            SELECT ur.*, iq.question_text, iq.question_index
            FROM user_responses ur
            JOIN interview_questions iq ON ur.question_id = iq.id
            WHERE ur.session_id = ?
            ORDER BY iq.question_index ASC
        """, (session_id,))
        responses_data = cursor.fetchall()
        
        # Get column names for responses
        response_columns = [description[0] for description in cursor.description]
        responses = []
        for response_row in responses_data:
            response_dict = dict(zip(response_columns, response_row))
            responses.append(response_dict)
        
        # Get transcript for this session
        cursor.execute("""
            SELECT * FROM transcripts 
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        """, (session_id,))
        transcript_data = cursor.fetchone()
        
        transcript = None
        if transcript_data:
            transcript_columns = [description[0] for description in cursor.description]
            transcript = dict(zip(transcript_columns, transcript_data))
        
        # Get feedback for this session
        cursor.execute("""
            SELECT * FROM feedback 
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        """, (session_id,))
        feedback_data = cursor.fetchone()
        
        feedback = None
        if feedback_data:
            feedback_columns = [description[0] for description in cursor.description]
            feedback = dict(zip(feedback_columns, feedback_data))
        
        conn.close()
        
        return {
            "success": True,
            "session": session_dict,
            "questions": questions,
            "responses": responses,
            "transcript": transcript,
            "feedback": feedback,
            "summary": {
                "total_questions": len(questions),
                "total_responses": len(responses),
                "has_transcript": transcript is not None,
                "has_feedback": feedback is not None,
                "completion_rate": len(responses) / len(questions) if questions else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting session data: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/interview/export/{session_id}")
async def export_interview_data(session_id: str):
    """Export comprehensive interview data as JSON"""
    try:
        # Get session data
        session_response = await get_interview_session_data(session_id)
        
        if isinstance(session_response, JSONResponse):
            return session_response
        
        session_data = session_response.body.decode('utf-8')
        session_json = json.loads(session_data)
        
        if not session_json.get("success"):
            return JSONResponse({"error": "Failed to get session data"}, status_code=500)
        
        # Create comprehensive export data
        export_data = {
            "export_info": {
                "exported_at": datetime.now().isoformat(),
                "session_id": session_id,
                "format_version": "1.0"
            },
            "interview_session": session_json.get("session", {}),
            "questions": session_json.get("questions", []),
            "responses": session_json.get("responses", []),
            "transcript": session_json.get("transcript", {}),
            "feedback": session_json.get("feedback", {}),
            "summary": session_json.get("summary", {}),
            "metadata": {
                "total_questions": len(session_json.get("questions", [])),
                "total_responses": len(session_json.get("responses", [])),
                "has_transcript": session_json.get("transcript") is not None,
                "has_feedback": session_json.get("feedback") is not None,
                "completion_rate": session_json.get("summary", {}).get("completion_rate", 0)
            }
        }
        
        # Return as downloadable JSON file
        from fastapi.responses import Response
        return Response(
            content=json.dumps(export_data, indent=2, default=str),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=interview_data_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            }
        )
        
    except Exception as e:
        logger.error(f"Error exporting interview data: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/ai/test-analysis")
async def test_ai_analysis(request: Request):
    """Test endpoint for AI analysis without OpenAI API calls"""
    try:
        data = await request.json()
        session_data = data.get("session_data", {})
        analysis_type = data.get("analysis_type", "post_interview")
        
        if not session_data:
            return JSONResponse({"error": "Missing session data"}, status_code=400)
        
        # Return mock analysis data for testing
        mock_analysis = {
            "success": True,
            "analysis_type": analysis_type,
            "timestamp": datetime.now().isoformat(),
            "session_id": session_data.get("session_id", "test-session"),
            "overall_score": 8,
            "metrics": {
                "technical_accuracy": 0.8,
                "communication_clarity": 0.7,
                "confidence_level": 0.6,
                "problem_solving": 0.8,
                "cultural_fit": 0.7,
                "emotional_intelligence": 0.6,
                "leadership_potential": 0.5,
                "learning_ability": 0.8
            },
            "summary": "This is a test analysis showing the structure of AI feedback. In a real implementation, this would contain AI-generated insights based on your interview responses.",
            "strengths": [
                "Good technical knowledge demonstrated",
                "Clear communication style",
                "Logical problem-solving approach"
            ],
            "improvements": [
                "Could provide more specific examples",
                "Show more confidence in responses",
                "Include quantifiable achievements"
            ],
            "recommendations": [
                "Practice mock interviews regularly",
                "Build a portfolio of projects",
                "Network with industry professionals"
            ],
            "next_steps": [
                "Review this feedback thoroughly",
                "Create a 30-day improvement plan",
                "Schedule follow-up practice sessions"
            ],
            "career_advice": [
                "Focus on skill development in your weak areas",
                "Consider pursuing relevant certifications",
                "Build your professional network"
            ],
            "skill_gaps": [
                "Advanced system design concepts",
                "Leadership and team management",
                "Industry-specific domain knowledge"
            ],
            "development_plan": [
                "30 days: Focus on technical skill building",
                "60 days: Work on communication and confidence",
                "90 days: Apply for roles and practice interviews"
            ]
        }
        
        return mock_analysis
        
    except Exception as e:
        logger.error(f"Error in test AI analysis: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)
