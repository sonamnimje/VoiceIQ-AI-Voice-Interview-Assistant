from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, Body, UploadFile, File, Form
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
import asyncio
import json
import os
import tempfile
from pathlib import Path
import logging
import sqlite3
import csv
import socketio
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import existing modules
from db_utils import (
    init_db, add_user, save_dashboard_stats, update_user_profile,
    get_dashboard_stats, save_feedback, get_feedback, save_transcript, get_transcripts,
    change_user_password, get_user_language, update_user_language, clear_transcripts,
    # New enhanced functions
    start_interview_session, end_interview_session, add_interview_question, save_user_response,
    save_transcript_enhanced, save_feedback_enhanced, get_feedback_enhanced, get_interview_session, get_user_interview_history,
    get_dashboard_stats_enhanced, save_interview_analytics, update_dashboard_stats_after_interview
)

# Import new advanced features
from voice_processor import get_or_create_session as get_voice_session

from llm_feedback import feedback_engine
from resume_processor import resume_processor
from interview_modes import interview_mode_manager, InterviewMode

# Import feedback routes
from feedback_routes import router as feedback_router

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

app = FastAPI()

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include feedback routes
app.include_router(feedback_router)

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

# Initialize database and show connection info
init_db()
db_path = os.path.abspath("database.db")
print(f"🚀 Backend started!")
print(f"📁 Database connected to: {db_path}")
print(f"✅ Database exists: {os.path.exists(db_path)}")

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
    conn = sqlite3.connect("database.db")
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
    conn = sqlite3.connect("database.db")
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
    conn = sqlite3.connect("database.db")
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



@app.get("/api/feedback/interactions")
async def api_get_feedback_interactions(email: str):
    """Get feedback interactions with /api/ prefix for frontend compatibility"""
    # Try to get enhanced feedback first, fallback to old feedback
    feedback = get_feedback_enhanced(email)
    
    if feedback:
        import json
        # Parse JSON fields if present
        try:
            if feedback.get("categories"):
                feedback["categories"] = json.loads(feedback["categories"]) if isinstance(feedback["categories"], str) else feedback["categories"]
            if feedback.get("suggestions"):
                feedback["suggestions"] = json.loads(feedback["suggestions"]) if isinstance(feedback["suggestions"], str) else feedback["suggestions"]
            if feedback.get("transcript"):
                parsed_transcript = json.loads(feedback["transcript"]) if isinstance(feedback["transcript"], str) else feedback["transcript"]
                # Ensure transcript is an array, if not, convert to array format
                if not isinstance(parsed_transcript, list):
                    feedback["transcript"] = [{"time": "00:00", "text": str(parsed_transcript), "tag": "general"}]
                else:
                    feedback["transcript"] = parsed_transcript
        except Exception as e:
            # If JSON parsing fails, provide fallback structure
            if feedback.get("transcript"):
                feedback["transcript"] = [{"time": "00:00", "text": str(feedback["transcript"]), "tag": "general"}]
            else:
                feedback["transcript"] = []
        
        # Convert to the format expected by the frontend
        interactions = []
        if feedback.get("transcript"):
            for i, item in enumerate(feedback["transcript"]):
                if isinstance(item, dict):
                    interaction = {
                        "timestamp": item.get("time", f"00:{i:02d}"),
                        "speaker": "ai" if "ai" in str(item.get("text", "")).lower() else "user",
                        "text": item.get("text", ""),
                        "interactionType": "question" if "ai" in str(item.get("text", "")).lower() else "voice-answer",
                        "confidence": 0.85,
                        "responseTime": 2.0
                    }
                    interactions.append(interaction)
        
        session_info = {
            "role": "Software Engineer",  # Default role
            "date": datetime.now().strftime("%Y-%m-%d"),
            "duration": "5:00",
            "totalQuestions": len([i for i in interactions if i["speaker"] == "ai"])
        }
        
        return {
            "interactions": interactions,
            "session_info": session_info
        }
    
    # Return default feedback if none exists
    return {
        "interactions": [],
        "session_info": {
            "role": "Software Engineer",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "duration": "0:00",
            "totalQuestions": 0
        }
    }



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
    
    conn = sqlite3.connect("database.db")
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
        conn = sqlite3.connect("database.db")
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
        conn = sqlite3.connect("database.db")
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
        conn = sqlite3.connect("database.db")
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
        
        conn = sqlite3.connect("database.db")
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
            # Process resume
            logger.info(f"Processing resume file: {temp_file_path}")
            result = resume_processor.process_resume(temp_file_path)
            
            if result["success"]:
                # Match skills to role
                skill_match = resume_processor.match_skills_to_role(
                    result["extracted_info"], role
                )
                
                logger.info(f"Resume processed successfully. Skills found: {len(result['extracted_info'].get('skills', {}))}")
                
                return {
                    "success": True,
                    "analysis": {
                        "extracted_info": result["extracted_info"],
                        "skill_match": skill_match
                    }
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
        conn = sqlite3.connect("database.db")
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

# Note: WebSocket functionality is now handled by Socket.IO
# The FastAPI WebSocket endpoint has been removed to avoid conflicts

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
            voice_session = get_voice_session(session_id, role)
            result = await voice_session.process_interview_audio(audio_bytes, asyncio.get_event_loop().time())
            
            logger.info(f"Voice processing result: {result}")
            
            # Send results back to client
            await sio.emit('voice_result', {
                'transcript': result.get('transcript'),
                'audio_quality': result.get('audio_quality')
            }, room=sid)
            
            logger.info("Voice result sent to client")
            
        except Exception as e:
            logger.error(f"Error in voice processing: {e}")
            await sio.emit('error', {'message': f'Voice processing error: {str(e)}'}, room=sid)
        
    except Exception as e:
        logger.error(f"Error processing voice data: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def feedback(sid, data):
    """Handle feedback request from client"""
    try:
        question = data.get("question")
        answer = data.get("answer")
        role = data.get("role", "Software Engineer")
        
        if not question or not answer:
            await sio.emit('error', {'message': 'Missing question or answer'}, room=sid)
            return
        
        # Get feedback from LLM
        feedback_result = await feedback_engine.analyze_interview_response(question, answer, role)
        
        await sio.emit('feedback_result', {
            'feedback': feedback_result
        }, room=sid)
        
    except Exception as e:
        logger.error(f"Error processing feedback request: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

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
        
        session_id = start_interview_session(user_email, role, interview_mode)
        
        return {
            "success": True,
            "sessionId": session_id,
            "message": "Interview session started successfully"
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
            conn = sqlite3.connect("database.db")
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
        conn = sqlite3.connect("database.db")
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
        conn = sqlite3.connect("database.db")
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

@app.post("/api/feedback/save")
async def save_feedback_api(request: Request):
    """Save comprehensive feedback data with detailed analysis"""
    try:
        data = await request.json()
        session_id = data.get("sessionId")
        user_email = data.get("userEmail")
        overall_score = data.get("overallScore")
        technical_score = data.get("technicalScore")
        communication_score = data.get("communicationScore")
        problem_solving_score = data.get("problemSolvingScore")
        confidence_score = data.get("confidenceScore")
        categories = data.get("categories")
        detailed_feedback = data.get("detailedFeedback")
        suggestions = data.get("suggestions")
        strengths = data.get("strengths")
        areas_for_improvement = data.get("areasForImprovement")
        ai_generated_feedback = data.get("aiGeneratedFeedback")
        transcript = data.get("transcript")
        tts_feedback = data.get("ttsFeedback")
        
        if not session_id or not user_email:
            return JSONResponse({"error": "Missing required fields"}, status_code=400)
        
        # Save enhanced feedback
        feedback_id = save_feedback_enhanced(
            session_id=session_id,
            user_email=user_email,
            overall_score=overall_score,
            technical_score=technical_score,
            communication_score=communication_score,
            problem_solving_score=problem_solving_score,
            confidence_score=confidence_score,
            categories=categories,
            detailed_feedback=detailed_feedback,
            suggestions=suggestions,
            strengths=strengths,
            areas_for_improvement=areas_for_improvement,
            ai_generated_feedback=ai_generated_feedback,
            transcript=transcript,
            tts_feedback=tts_feedback
        )
        
        # Update session with feedback info and end time
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE interview_sessions 
            SET 
                end_time = ?,
                status = 'completed',
                session_data = json_set(
                    COALESCE(session_data, '{}'),
                    '$.feedback_id', ?,
                    '$.feedback_saved_at', ?,
                    '$.overall_score', ?
                )
            WHERE session_id = ?
        """, (datetime.now().isoformat(), feedback_id, datetime.now().isoformat(), overall_score, session_id))
        conn.commit()
        conn.close()
        
        # Update dashboard stats
        try:
            update_dashboard_stats_after_interview(user_email, overall_score)
        except Exception as e:
            logger.error(f"Error updating dashboard stats: {e}")
        
        return {
            "success": True,
            "feedbackId": feedback_id,
            "message": "Feedback saved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error saving feedback: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/interview/session/{session_id}")
async def get_session(session_id: str):
    """Get interview session details"""
    try:
        session = get_interview_session(session_id)
        if session:
            return {"success": True, "session": session}
        else:
            return JSONResponse({"error": "Session not found"}, status_code=404)
    except Exception as e:
        logger.error(f"Error getting session: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/interview/history/{user_email}")
async def get_interview_history(user_email: str, limit: int = 10):
    """Get user's interview history"""
    try:
        history = get_user_interview_history(user_email, limit)
        return {"success": True, "history": history}
    except Exception as e:
        logger.error(f"Error getting interview history: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/interview/history")
async def get_interview_history_general(request: Request):
    """Get interview history for the authenticated user"""
    try:
        # Extract user email from request headers
        user_email = request.headers.get("X-User-Email")
        if not user_email:
            return {"success": False, "error": "User not authenticated"}
        
        history = get_user_interview_history(user_email, 20)
        return {"success": True, "sessions": history}
    except Exception as e:
        logger.error(f"Error getting interview history: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/practice/history")
async def get_practice_history(request: Request):
    """Get practice history for the authenticated user"""
    try:
        # Extract user email from request headers
        user_email = request.headers.get("X-User-Email")
        if not user_email:
            return {"success": False, "error": "User not authenticated"}
        
        # For now, return mock practice data
        # In a real implementation, you would query a practice_sessions table
        mock_practice_data = [
            {
                "id": 1,
                "type": "practice",
                "mode": "beginner",
                "score": 7.5,
                "duration": 1800,  # 30 minutes in seconds
                "created_at": "2024-01-15T10:30:00Z",
                "questions_answered": 5
            },
            {
                "id": 2,
                "type": "practice",
                "mode": "intermediate",
                "score": 8.2,
                "duration": 2400,  # 40 minutes in seconds
                "created_at": "2024-01-14T14:20:00Z",
                "questions_answered": 7
            },
            {
                "id": 3,
                "type": "practice",
                "mode": "behavioral",
                "score": 6.8,
                "duration": 1200,  # 20 minutes in seconds
                "created_at": "2024-01-13T09:15:00Z",
                "questions_answered": 4
            }
        ]
        
        return {"success": True, "sessions": mock_practice_data}
    except Exception as e:
        logger.error(f"Error getting practice history: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/interview/sessions-with-transcripts/{user_email}")
async def get_interview_sessions_with_transcripts(user_email: str, limit: int = 20):
    """Get user's interview sessions with their associated transcripts"""
    try:
        import sqlite3
        import json
        
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()
        
        # Get interview sessions with feedback scores
        cursor.execute("""
            SELECT s.session_id, s.role, s.interview_mode, s.status, s.start_time, s.end_time,
                   s.total_questions, s.questions_answered, f.overall_score, f.technical_score,
                   f.communication_score, f.problem_solving_score, f.confidence_score
            FROM interview_sessions s
            LEFT JOIN feedback f ON s.session_id = f.session_id
            WHERE s.user_email = ?
            ORDER BY s.start_time DESC
            LIMIT ?
        """, (user_email, limit))
        
        sessions = cursor.fetchall()
        
        # Get transcripts for this user (since session IDs might not match)
        cursor.execute("""
            SELECT session_id, transcript_data, created_at
            FROM transcripts 
            WHERE email = ?
            ORDER BY created_at DESC
        """, (user_email,))
        
        transcript_rows = cursor.fetchall()
        transcripts = {}
        for row in transcript_rows:
            session_id, transcript_data, created_at = row
            try:
                parsed_data = json.loads(transcript_data) if isinstance(transcript_data, str) else transcript_data
                transcripts[session_id] = {
                    "data": parsed_data,
                    "createdAt": created_at
                }
            except:
                transcripts[session_id] = {
                    "data": transcript_data,
                    "createdAt": created_at
                }
        
        conn.close()
        
        # Combine sessions with transcripts
        result = []
        for session in sessions:
            session_id, role, interview_mode, status, start_time, end_time, total_questions, questions_answered, overall_score, technical_score, communication_score, problem_solving_score, confidence_score = session
            
            # Calculate duration if end_time is available
            duration = "00:00"
            if start_time and end_time:
                try:
                    from datetime import datetime
                    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                    duration_seconds = int((end_dt - start_dt).total_seconds())
                    minutes = duration_seconds // 60
                    seconds = duration_seconds % 60
                    duration = f"{minutes:02d}:{seconds:02d}"
                except:
                    pass
            
            # Try to find matching transcript data
            transcript_data = {}
            transcript_created_at = None
            
            # First try exact session ID match
            if session_id in transcripts:
                transcript_data = transcripts[session_id].get("data", {})
                transcript_created_at = transcripts[session_id].get("createdAt")
            else:
                # Try to find transcript by matching creation time or other criteria
                # For now, let's use the first available transcript for this user
                if transcripts:
                    # Get the most recent transcript
                    first_transcript_key = list(transcripts.keys())[0]
                    transcript_data = transcripts[first_transcript_key].get("data", {})
                    transcript_created_at = transcripts[first_transcript_key].get("createdAt")
            
            scorecard = transcript_data.get("scorecard", [])
            actual_questions_answered = len(scorecard) if isinstance(scorecard, list) else 0
            
            # If no transcript data, use a default question count based on interview mode
            if actual_questions_answered == 0:
                if interview_mode == "technical":
                    default_questions = 5
                elif interview_mode == "hr":
                    default_questions = 3
                elif interview_mode == "behavioral":
                    default_questions = 4
                else:
                    default_questions = 3
                actual_questions_answered = default_questions
            
            session_data = {
                "sessionId": session_id,
                "role": role,
                "interviewMode": interview_mode,
                "status": status,
                "startTime": start_time,
                "endTime": end_time,
                "duration": duration,
                "totalQuestions": actual_questions_answered,
                "questionsAnswered": actual_questions_answered,
                "overallScore": overall_score,
                "technicalScore": technical_score,
                "communicationScore": communication_score,
                "problemSolvingScore": problem_solving_score,
                "confidenceScore": confidence_score,
                "transcript": transcript_data,
                "transcriptCreatedAt": transcript_created_at
            }
            
            result.append(session_data)
        
        return {"success": True, "sessions": result}
    except Exception as e:
        logger.error(f"Error getting interview sessions with transcripts: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/dashboard/stats/{user_email}")
async def get_dashboard_stats_api(user_email: str):
    """Get enhanced dashboard statistics"""
    try:
        stats = get_dashboard_stats_enhanced(user_email)
        if stats:
            return {"success": True, "stats": stats}
        else:
            return {"success": True, "stats": {
                "totalInterviews": 0,
                "completedInterviews": 0,
                "avgOverallScore": 0,
                "avgTechnicalScore": 0,
                "avgCommunicationScore": 0,
                "avgProblemSolvingScore": 0,
                "avgConfidenceScore": 0,
                "totalTimeSpent": 0,
                "lastInterviewDate": None,
                "bestScore": 0,
                "improvementTrend": None
            }}
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
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
        conn = sqlite3.connect("database.db")
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
        conn = sqlite3.connect("database.db")
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
        conn = sqlite3.connect("database.db")
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

@app.post("/api/feedback/enhanced-analysis")
async def enhanced_feedback_analysis(request: Request):
    """Enhanced feedback analysis combining LLM and rule-based evaluation"""
    try:
        data = await request.json()
        question = data.get("question", {})
        response = data.get("response", "")
        mode = data.get("mode", "hr")
        role = data.get("role", "Software Engineer")
        context = data.get("context", {})
        
        if not question or not response:
            return JSONResponse({"error": "Missing question or response"}, status_code=400)
        
        # Get rule-based evaluation from interview modes
        rule_evaluation = interview_mode_manager.evaluate_response(question, response, mode)
        
        # Get LLM-based analysis
        llm_analysis = await feedback_engine.analyze_interview_response(
            question.get("question", ""), response, role, context
        )
        
        # Combine and enhance the analysis
        enhanced_analysis = {
            "overall_score": (rule_evaluation.get("score", 0) + llm_analysis.get("score", 0) * 10) / 2,
            "rule_based_evaluation": rule_evaluation,
            "llm_analysis": llm_analysis,
            "combined_metrics": {
                "technical_depth": max(rule_evaluation.get("technical_depth", 0), llm_analysis.get("technical_depth", 0)),
                "communication_clarity": max(rule_evaluation.get("communication_clarity", 0), llm_analysis.get("communication_clarity", 0)),
                "emotional_intelligence": max(rule_evaluation.get("emotional_intelligence", 0), llm_analysis.get("emotional_intelligence", 0)),
                "cultural_fit": max(rule_evaluation.get("cultural_fit", 0), llm_analysis.get("cultural_fit", 0)),
                "problem_solving": max(rule_evaluation.get("problem_solving", 0), llm_analysis.get("problem_solving", 0)),
                "confidence_level": max(rule_evaluation.get("confidence_level", 0), llm_analysis.get("confidence_level", 0)),
                "leadership_potential": rule_evaluation.get("leadership_potential", 0),
                "innovation_creativity": rule_evaluation.get("innovation_creativity", 0),
                "stress_management": rule_evaluation.get("stress_management", 0),
                "adaptability": rule_evaluation.get("adaptability", 0)
            },
            "performance_insights": {
                "strengths": list(set(rule_evaluation.get("strengths", []) + llm_analysis.get("strengths", []))),
                "improvements": list(set(rule_evaluation.get("improvements", []) + llm_analysis.get("improvements", []))),
                "keywords_found": rule_evaluation.get("keywords_found", []),
                "ai_keywords": llm_analysis.get("keywords", [])
            },
            "recommendations": {
                "immediate_actions": [
                    "Practice the identified improvement areas",
                    "Review similar questions in your target role",
                    "Record and analyze your responses"
                ],
                "long_term_development": [
                    "Build on your identified strengths",
                    "Focus on the weakest areas systematically",
                    "Seek feedback from mentors or peers"
                ]
            },
            "confidence_score": (rule_evaluation.get("confidence", 0) + llm_analysis.get("confidence", 0)) / 2,
            "timestamp": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "analysis": enhanced_analysis
        }
        
    except Exception as e:
        logger.error(f"Error in enhanced feedback analysis: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/feedback/session-comprehensive")
async def comprehensive_session_feedback(request: Request):
    """Generate comprehensive feedback for entire interview session"""
    try:
        data = await request.json()
        session_data = data.get("session_data", {})
        role = data.get("role", "Software Engineer")
        mode = data.get("mode", "hr")
        
        if not session_data:
            return JSONResponse({"error": "Missing session data"}, status_code=400)
        
        # Generate comprehensive LLM feedback
        llm_comprehensive = await feedback_engine.generate_comprehensive_feedback(session_data, role)
        
        # Analyze emotional intelligence across all responses
        responses = session_data.get("responses", [])
        ei_analysis = await feedback_engine.analyze_emotional_intelligence(responses)
        
        # Calculate session-wide metrics
        session_metrics = {
            "total_questions": len(responses),
            "average_response_time": sum(r.get("response_time", 0) for r in responses) / len(responses) if responses else 0,
            "consistency_score": self._calculate_consistency_score(responses),
            "improvement_trend": self._calculate_improvement_trend(responses),
            "strongest_areas": self._identify_strongest_areas(responses),
            "weakest_areas": self._identify_weakest_areas(responses)
        }
        
        comprehensive_feedback = {
            "session_overview": {
                "role": role,
                "mode": mode,
                "total_questions": session_metrics["total_questions"],
                "session_duration": session_data.get("duration", 0),
                "overall_performance": llm_comprehensive.get("overall_score", 0)
            },
            "performance_analysis": llm_comprehensive,
            "emotional_intelligence": ei_analysis,
            "session_metrics": session_metrics,
            "detailed_breakdown": {
                "technical_performance": {
                    "score": llm_comprehensive.get("technical_score", 0),
                    "strengths": [s for s in llm_comprehensive.get("strengths", []) if "technical" in s.lower()],
                    "improvements": [i for i in llm_comprehensive.get("improvements", []) if "technical" in i.lower()]
                },
                "communication_performance": {
                    "score": llm_comprehensive.get("communication_score", 0),
                    "strengths": [s for s in llm_comprehensive.get("strengths", []) if "communication" in s.lower()],
                    "improvements": [i for i in llm_comprehensive.get("improvements", []) if "communication" in i.lower()]
                },
                "leadership_potential": {
                    "score": llm_comprehensive.get("leadership_score", 0),
                    "indicators": self._extract_leadership_indicators(responses)
                }
            },
            "action_plan": {
                "immediate_next_steps": llm_comprehensive.get("next_steps", []),
                "skill_development": llm_comprehensive.get("development_plan", []),
                "career_guidance": llm_comprehensive.get("career_advice", []),
                "practice_recommendations": self._generate_practice_recommendations(session_metrics, mode)
            },
            "predictive_insights": {
                "interview_readiness": llm_comprehensive.get("interview_readiness", 0),
                "projected_performance": self._project_performance(session_metrics),
                "confidence_level": "high" if session_metrics["consistency_score"] > 7 else "medium"
            }
        }
        
        return {
            "success": True,
            "comprehensive_feedback": comprehensive_feedback
        }
        
    except Exception as e:
        logger.error(f"Error generating comprehensive session feedback: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

def _calculate_consistency_score(self, responses: List[Dict[str, Any]]) -> float:
    """Calculate consistency score across responses"""
    if not responses:
        return 0
    
    scores = [r.get("score", 0) for r in responses]
    if not scores:
        return 0
    
    mean_score = sum(scores) / len(scores)
    variance = sum((score - mean_score) ** 2 for score in scores) / len(scores)
    std_dev = variance ** 0.5
    
    # Lower standard deviation = higher consistency
    consistency = max(0, 10 - (std_dev * 2))
    return round(consistency, 1)

def _calculate_improvement_trend(self, responses: List[Dict[str, Any]]) -> str:
    """Calculate improvement trend across responses"""
    if len(responses) < 3:
        return "insufficient_data"
    
    scores = [r.get("score", 0) for r in responses]
    first_half = scores[:len(scores)//2]
    second_half = scores[len(scores)//2:]
    
    first_avg = sum(first_half) / len(first_half)
    second_avg = sum(second_half) / len(second_half)
    
    if second_avg > first_avg + 1:
        return "improving"
    elif second_avg < first_avg - 1:
        return "declining"
    else:
        return "stable"

def _identify_strongest_areas(self, responses: List[Dict[str, Any]]) -> List[str]:
    """Identify strongest performance areas"""
    if not responses:
        return []
    
    # Aggregate all strengths from responses
    all_strengths = []
    for response in responses:
        all_strengths.extend(response.get("strengths", []))
    
    # Count frequency and return top 3
    from collections import Counter
    strength_counts = Counter(all_strengths)
    return [strength for strength, count in strength_counts.most_common(3)]

def _identify_weakest_areas(self, responses: List[Dict[str, Any]]) -> List[str]:
    """Identify weakest performance areas"""
    if not responses:
        return []
    
    # Aggregate all improvements from responses
    all_improvements = []
    for response in responses:
        all_improvements.extend(response.get("improvements", []))
    
    # Count frequency and return top 3
    from collections import Counter
    improvement_counts = Counter(all_improvements)
    return [improvement for improvement, count in improvement_counts.most_common(3)]

def _extract_leadership_indicators(self, responses: List[Dict[str, Any]]) -> List[str]:
    """Extract leadership indicators from responses"""
    indicators = []
    for response in responses:
        response_text = response.get("response", "").lower()
        if any(word in response_text for word in ["led", "managed", "initiated", "mentored"]):
            indicators.append("Leadership actions mentioned")
        if any(word in response_text for word in ["team", "collaboration", "coordination"]):
            indicators.append("Team collaboration demonstrated")
        if any(word in response_text for word in ["decision", "strategy", "vision"]):
            indicators.append("Strategic thinking shown")
    
    return list(set(indicators))

def _generate_practice_recommendations(self, session_metrics: Dict[str, Any], mode: str) -> List[str]:
    """Generate practice recommendations based on session metrics"""
    recommendations = []
    
    if session_metrics.get("consistency_score", 0) < 6:
        recommendations.append("Focus on consistency - practice similar questions multiple times")
    
    if session_metrics.get("improvement_trend") == "declining":
        recommendations.append("Review your approach - consider taking breaks between practice sessions")
    
    weakest_areas = session_metrics.get("weakest_areas", [])
    if "communication" in str(weakest_areas).lower():
        recommendations.append("Practice clear communication - record and review your responses")
    
    if "technical" in str(weakest_areas).lower():
        recommendations.append("Strengthen technical fundamentals - review core concepts")
    
    recommendations.append(f"Practice more {mode} interview questions to build confidence")
    
    return recommendations

def _project_performance(self, session_metrics: Dict[str, Any]) -> Dict[str, Any]:
    """Project future performance based on current metrics"""
    current_score = session_metrics.get("average_score", 5)
    consistency = session_metrics.get("consistency_score", 5)
    trend = session_metrics.get("improvement_trend", "stable")
    
    # Simple projection model
    if trend == "improving":
        projected_1month = min(10, current_score + 1)
        projected_3months = min(10, current_score + 2)
    elif trend == "declining":
        projected_1month = max(0, current_score - 0.5)
        projected_3months = max(0, current_score - 1)
    else:
        projected_1month = current_score
        projected_3months = current_score + 0.5
    
    return {
        "current_score": current_score,
        "projected_1month": round(projected_1month, 1),
        "projected_3months": round(projected_3months, 1),
        "confidence": "high" if consistency > 7 else "medium"
    }

# Main function to run the Socket.IO app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)
