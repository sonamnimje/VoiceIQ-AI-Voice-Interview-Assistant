#!/usr/bin/env python3
"""
PostgreSQL Database Initialization Script for VoiceIQ
This script creates all necessary tables with proper foreign key relationships.
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from config import DATABASE_URL, DATABASE_CONFIG
from db_utils import get_connection, DatabaseError

def create_postgres_schema():
    """Create PostgreSQL schema with proper foreign key relationships."""
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found. Please set DATABASE_URL environment variable.")
        return False
    
    print("🔧 Initializing PostgreSQL database schema...")
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                username VARCHAR(255),
                gmail VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255),
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                profile_pic TEXT,
                role VARCHAR(50) DEFAULT 'User',
                language VARCHAR(10) DEFAULT 'English',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                reset_token VARCHAR(255),
                reset_token_expires TIMESTAMP
            )
        """)
        
        # Create indexes for users table
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_gmail ON users(gmail)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        
        # Create interview_sessions table with proper foreign key
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interview_sessions (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) UNIQUE NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                role VARCHAR(255) NOT NULL,
                interview_mode VARCHAR(100) DEFAULT 'standard',
                status VARCHAR(50) DEFAULT 'active',
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                total_questions INTEGER DEFAULT 0,
                questions_answered INTEGER DEFAULT 0,
                current_question_index INTEGER DEFAULT 0,
                session_data TEXT,
                resume_analysis TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
            )
        """)
        
        # Create interview_questions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interview_questions (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) NOT NULL,
                question_index INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                question_type VARCHAR(50) DEFAULT 'text',
                category VARCHAR(100),
                difficulty VARCHAR(50) DEFAULT 'medium',
                asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
                UNIQUE(session_id, question_index)
            )
        """)
        
        # Create user_responses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_responses (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) NOT NULL,
                question_id INTEGER NOT NULL,
                user_answer TEXT,
                audio_file_path TEXT,
                response_duration REAL,
                confidence_score REAL,
                emotion_detected VARCHAR(100),
                analysis_result TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES interview_questions(id) ON DELETE CASCADE
            )
        """)
        
        # Create transcripts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transcripts (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                transcript_data TEXT NOT NULL,
                raw_audio_path TEXT,
                processed_audio_path TEXT,
                word_timestamps TEXT,
                confidence_scores TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
            )
        """)
        
        # Create feedback table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
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
                transcript TEXT,
                tts_feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
            )
        """)
        
        # Create dashboard_stats table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dashboard_stats (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                total_interviews INTEGER DEFAULT 0,
                completed_interviews INTEGER DEFAULT 0,
                avg_overall_score REAL DEFAULT 0,
                avg_technical_score REAL DEFAULT 0,
                avg_communication_score REAL DEFAULT 0,
                avg_problem_solving_score REAL DEFAULT 0,
                avg_confidence_score REAL DEFAULT 0,
                total_time_spent REAL DEFAULT 0,
                last_interview_date TIMESTAMP,
                best_score REAL DEFAULT 0,
                improvement_trend TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
            )
        """)
        
        # Create interview_analytics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interview_analytics (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                question_analytics TEXT,
                voice_metrics TEXT,
                response_patterns TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
            )
        """)
        
        # Create additional indexes for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_email ON interview_sessions(user_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_user_email ON feedback(user_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_dashboard_stats_user_email ON dashboard_stats(user_email)")
        
        conn.commit()
        print("✅ PostgreSQL database schema initialized successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize PostgreSQL database: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def test_connection():
    """Test database connection and basic operations."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT version()")
        version = cursor.fetchone()
        print(f"✅ Connected to PostgreSQL: {version[0]}")
        
        # Test table existence
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        print(f"✅ Found {len(tables)} tables: {[t[0] for t in tables]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 VoiceIQ PostgreSQL Database Initialization")
    print("=" * 50)
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL environment variable not set!")
        print("Please set DATABASE_URL to your PostgreSQL connection string.")
        sys.exit(1)
    
    print(f"📊 Database URL: {DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['path']}")
    
    # Test connection first
    if not test_connection():
        sys.exit(1)
    
    # Initialize schema
    if create_postgres_schema():
        print("🎉 Database initialization completed successfully!")
    else:
        print("💥 Database initialization failed!")
        sys.exit(1)
