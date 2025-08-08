from fastapi import FastAPI, Request, HTTPException, Body, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sqlite3
import json
import logging
from datetime import datetime
import asyncio
from typing import Dict, List
import os

# Import database utilities
from db_utils import (
    init_db, add_user, get_user, save_dashboard_stats, get_dashboard_stats_enhanced,
    save_transcript_enhanced, get_transcripts, save_feedback_enhanced, get_feedback,
    get_dashboard_stats_enhanced, save_interview_analytics
)

app = FastAPI()

# Initialize database
init_db()

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/")
def root():
    return {"message": "API is running!"}

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
    gmail = user.get("gmail")
    try:
        add_user(
            email=user["email"],
            username=user["username"],
            password=user["password"],
            gmail=gmail
        )
        return {"message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
        return {"success": True, "user": {"email": user[4], "username": user[2]}}
    else:
        return JSONResponse({"error": "Invalid credentials"}, status_code=401)

@app.get("/transcripts")
async def api_get_transcripts(email: str):
    import json
    transcripts = get_transcripts(email)
    # Parse JSON data field for each transcript
    for t in transcripts:
        try:
            t["data"] = json.loads(t["data"])
        except Exception:
            pass
    return {"transcripts": transcripts}

@app.post("/api/transcript/save")
async def save_transcript_api(request: Request):
    """Save enhanced transcript data"""
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
        
        transcript_id = save_transcript_enhanced(
            session_id, user_email, transcript_data, raw_audio_path,
            processed_audio_path, word_timestamps, confidence_scores
        )
        
        return {
            "success": True,
            "transcriptId": transcript_id,
            "message": "Transcript saved successfully"
        }
    except Exception as e:
        logger.error(f"Error saving transcript: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/dashboard_stats")
async def api_get_dashboard_stats(email: str):
    try:
        stats = get_dashboard_stats_enhanced(email)
        return {"stats": stats}
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/feedback")
async def api_get_feedback(email: str, session_id: str = None):
    try:
        feedback = get_feedback(email, session_id)
        return {"feedback": feedback}
    except Exception as e:
        logger.error(f"Error getting feedback: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000) 