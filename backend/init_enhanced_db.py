#!/usr/bin/env python3
"""
Enhanced Database Initialization Script
This script creates all the necessary tables for the enhanced interview system.
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "database.db"

def init_enhanced_database():
    """Initialize the enhanced database with all tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Initializing enhanced database...")
    
    # Users table (enhanced)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            username TEXT,
            gmail TEXT NOT NULL UNIQUE,
            email TEXT,
            password TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            profile_pic TEXT,
            role TEXT DEFAULT 'User',
            language TEXT DEFAULT 'English',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✓ Users table created/verified")
    
    # Interview sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            user_email TEXT NOT NULL,
            role TEXT NOT NULL,
            interview_mode TEXT DEFAULT 'standard',
            status TEXT DEFAULT 'active',
            start_time TEXT DEFAULT CURRENT_TIMESTAMP,
            end_time TEXT,
            total_questions INTEGER DEFAULT 0,
            questions_answered INTEGER DEFAULT 0,
            current_question_index INTEGER DEFAULT 0,
            session_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    """)
    print("✓ Interview sessions table created/verified")
    
    # Interview questions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            question_index INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            question_type TEXT DEFAULT 'text',
            category TEXT,
            difficulty TEXT DEFAULT 'medium',
            asked_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id)
        )
    """)
    print("✓ Interview questions table created/verified")
    
    # User responses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            question_id INTEGER NOT NULL,
            user_answer TEXT,
            audio_file_path TEXT,
            response_duration REAL,
            confidence_score REAL,
            emotion_detected TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
            FOREIGN KEY (question_id) REFERENCES interview_questions(id)
        )
    """)
    print("✓ User responses table created/verified")
    
    # Enhanced transcripts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transcripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_email TEXT NOT NULL,
            transcript_data TEXT NOT NULL,
            raw_audio_path TEXT,
            processed_audio_path TEXT,
            word_timestamps TEXT,
            confidence_scores TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    """)
    print("✓ Enhanced transcripts table created/verified")
    
    # Enhanced feedback table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_email TEXT NOT NULL,
            overall_score REAL,
            technical_score REAL,
            communication_score REAL,
            problem_solving_score REAL,
            confidence_score REAL,
            categories TEXT,
            detailed_feedback TEXT,
            suggestions TEXT,
            strengths TEXT,
            areas_for_improvement TEXT,
            ai_generated_feedback TEXT,
            transcript TEXT,  -- JSON transcript data
            tts_feedback TEXT,  -- Text-to-speech feedback
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    """)
    
    # Add missing columns if they don't exist (for existing databases)
    try:
        cursor.execute("ALTER TABLE feedback ADD COLUMN transcript TEXT")
    except sqlite3.OperationalError:
        # Column already exists, ignore the error
        pass
    
    try:
        cursor.execute("ALTER TABLE feedback ADD COLUMN tts_feedback TEXT")
    except sqlite3.OperationalError:
        # Column already exists, ignore the error
        pass
    
    print("✓ Enhanced feedback table created/verified")
    
    # Enhanced dashboard stats table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dashboard_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            total_interviews INTEGER DEFAULT 0,
            completed_interviews INTEGER DEFAULT 0,
            avg_overall_score REAL DEFAULT 0,
            avg_technical_score REAL DEFAULT 0,
            avg_communication_score REAL DEFAULT 0,
            avg_problem_solving_score REAL DEFAULT 0,
            avg_confidence_score REAL DEFAULT 0,
            total_time_spent REAL DEFAULT 0,
            last_interview_date TEXT,
            best_score REAL DEFAULT 0,
            improvement_trend TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    """)
    print("✓ Enhanced dashboard stats table created/verified")
    
    # Interview analytics table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_email TEXT NOT NULL,
            question_analytics TEXT,
            emotion_analysis TEXT,
            voice_metrics TEXT,
            response_patterns TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    """)
    print("✓ Interview analytics table created/verified")
    
    # Practice sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS practice_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            user_email TEXT NOT NULL,
            mode TEXT DEFAULT 'beginner',
            score REAL DEFAULT 0,
            duration INTEGER DEFAULT 0,
            questions_answered INTEGER DEFAULT 0,
            feedback TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users(email)
        )
    """)
    print("✓ Practice sessions table created/verified")
    
    # Create indexes for better performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_email ON interview_sessions(user_email)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_status ON interview_sessions(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_questions_session_id ON interview_questions(session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_responses_session_id ON user_responses(session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON interview_analytics(session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_email ON practice_sessions(user_email)")
    print("✓ Database indexes created/verified")
    
    conn.commit()
    conn.close()
    
    print("\n🎉 Enhanced database initialization completed successfully!")
    print("Database file: database.db")
    print("\nTables created:")
    print("- users (enhanced)")
    print("- interview_sessions")
    print("- interview_questions")
    print("- user_responses")
    print("- transcripts (enhanced)")
    print("- feedback (enhanced)")
    print("- dashboard_stats (enhanced)")
    print("- interview_analytics")
    print("- practice_sessions")

def add_sample_data():
    """Add sample data for testing"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\nAdding sample data...")
    
    # Add sample user
    try:
        cursor.execute("""
            INSERT INTO users (name, username, gmail, email, password, phone, address, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, ("Test User", "testuser", "test@example.com", "test@example.com", "password123", "1234567890", "Test Address", "User"))
        print("✓ Sample user added")
    except sqlite3.IntegrityError:
        print("ℹ Sample user already exists")
    
    # Add sample dashboard stats
    try:
        cursor.execute("""
            INSERT INTO dashboard_stats (user_email, total_interviews, completed_interviews, avg_overall_score)
            VALUES (?, ?, ?, ?)
        """, ("test@example.com", 0, 0, 0.0))
        print("✓ Sample dashboard stats added")
    except sqlite3.IntegrityError:
        print("ℹ Sample dashboard stats already exists")
    
    conn.commit()
    conn.close()
    print("✓ Sample data added successfully!")

if __name__ == "__main__":
    print("Enhanced Database Initialization")
    print("=" * 40)
    
    init_enhanced_database()
    add_sample_data()
    
    print("\n✅ Database setup complete!")
    print("You can now use the enhanced interview system with full database support.") 