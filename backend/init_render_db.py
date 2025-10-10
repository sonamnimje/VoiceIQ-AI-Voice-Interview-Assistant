"""
Initialize Render Postgres database for VoiceIQ.

This script will connect to the Postgres database referenced by the
DATABASE_URL environment variable and create the tables expected by the
application. It mirrors the schema created for the local SQLite version.

Usage:
  - Set the DATABASE_URL environment variable (Render provides this automatically when you attach a Postgres instance).
  - Run: python init_render_db.py

Note: This script uses psycopg2 to talk to Postgres. The app will continue
using sqlite when DATABASE_URL is not set.
"""

import os
import sys
import json
import traceback
from urllib.parse import urlparse

import psycopg2
from psycopg2.extras import execute_values

# Import config to read DATABASE_URL
from config import DATABASE_URL

if not DATABASE_URL:
    print("No DATABASE_URL found in environment. Set DATABASE_URL to a Postgres connection string and retry.")
    sys.exit(1)

print(f"Connecting to Postgres: {DATABASE_URL}")

# Connect to Postgres
try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
except Exception as e:
    print("Failed to connect to Postgres:", e)
    traceback.print_exc()
    sys.exit(2)

# SQL statements to create tables (Postgres compatible)
CREATE_TABLES_SQL = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        username TEXT,
        gmail TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        profile_pic TEXT,
        role TEXT DEFAULT 'User',
        language TEXT DEFAULT 'English',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        reset_token TEXT,
        reset_token_expires TIMESTAMP
    );
    """,

    """
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    """,

    """
    CREATE INDEX IF NOT EXISTS idx_users_gmail ON users(gmail);
    """,

    """
    CREATE TABLE IF NOT EXISTS interview_sessions (
        id SERIAL PRIMARY KEY,
        session_id TEXT UNIQUE NOT NULL,
        user_email TEXT NOT NULL,
        role TEXT NOT NULL,
        interview_mode TEXT DEFAULT 'standard',
        status TEXT DEFAULT 'active',
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        total_questions INTEGER DEFAULT 0,
        questions_answered INTEGER DEFAULT 0,
        current_question_index INTEGER DEFAULT 0,
        session_data JSONB,
        resume_analysis JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    );
    """,

    """
    CREATE TABLE IF NOT EXISTS interview_questions (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        question_index INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT DEFAULT 'text',
        category TEXT,
        difficulty TEXT DEFAULT 'medium',
        asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB,
        UNIQUE(session_id, question_index)
    );
    """,

    """
    CREATE TABLE IF NOT EXISTS user_responses (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        user_answer TEXT,
        audio_file_path TEXT,
        response_duration DOUBLE PRECISION,
        confidence_score DOUBLE PRECISION,
        emotion_detected TEXT,
        analysis_result JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    );
    """,

    """
    CREATE TABLE IF NOT EXISTS transcripts (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        transcript_data JSONB NOT NULL,
        raw_audio_path TEXT,
        processed_audio_path TEXT,
        word_timestamps JSONB,
        confidence_scores JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    );
    """,

    """
    CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        overall_score DOUBLE PRECISION,
        technical_score DOUBLE PRECISION,
        communication_score DOUBLE PRECISION,
        problem_solving_score DOUBLE PRECISION,
        confidence_score DOUBLE PRECISION,
        categories JSONB,
        detailed_feedback TEXT,
        suggestions TEXT,
        strengths TEXT,
        areas_for_improvement TEXT,
        ai_generated_feedback TEXT,
        transcript JSONB,
        tts_feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,

    """
    CREATE TABLE IF NOT EXISTS dashboard_stats (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        total_interviews INTEGER DEFAULT 0,
        completed_interviews INTEGER DEFAULT 0,
        avg_overall_score DOUBLE PRECISION DEFAULT 0,
        avg_technical_score DOUBLE PRECISION DEFAULT 0,
        avg_communication_score DOUBLE PRECISION DEFAULT 0,
        avg_problem_solving_score DOUBLE PRECISION DEFAULT 0,
        avg_confidence_score DOUBLE PRECISION DEFAULT 0,
        total_time_spent DOUBLE PRECISION DEFAULT 0,
        last_interview_date TIMESTAMP,
        best_score DOUBLE PRECISION DEFAULT 0,
        improvement_trend JSONB,
        updated_at TIMESTAMP
    );
    """,

    """
    CREATE TABLE IF NOT EXISTS interview_analytics (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        question_analytics JSONB,
        voice_metrics JSONB,
        response_patterns JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,
]


print("Creating tables...")
for stmt in CREATE_TABLES_SQL:
    try:
        cur.execute(stmt)
    except Exception as e:
        print("Failed to execute statement:", e)
        traceback.print_exc()

print("Tables created or already exist.")

# Optionally, create some initial indexes
try:
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transcripts_session ON transcripts(session_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_email ON interview_sessions(user_email);")
    print("Indexes created or already exist.")
except Exception:
    pass

# Close
cur.close()
conn.close()

print("Postgres initialization complete.")
