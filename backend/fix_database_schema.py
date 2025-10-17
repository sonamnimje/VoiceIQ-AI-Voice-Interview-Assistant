#!/usr/bin/env python3
"""
Fix database schema for existing Render PostgreSQL database
This script handles the foreign key constraint issues
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def fix_database_schema():
    """Fix the database schema by creating tables in the correct order."""
    
    print("🔧 Fixing database schema for existing Render database...")
    print("=" * 60)
    
    # Check if DATABASE_URL is set
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found!")
        return False
    
    print(f"📊 Using database: {database_url[:50]}...")
    
    try:
        from db_utils import get_connection
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Step 1: Create users table first (without foreign keys)
        print("🔧 Creating users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                username VARCHAR(255),
                gmail VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) UNIQUE,
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
        
        # Step 2: Create indexes for users table
        print("🔧 Creating indexes for users table...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_gmail ON users(gmail)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        
        # Step 3: Create interview_sessions table with proper foreign key
        print("🔧 Creating interview_sessions table...")
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
        
        # Step 4: Create other tables
        print("🔧 Creating interview_questions table...")
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
        
        print("🔧 Creating user_responses table...")
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
        
        print("🔧 Creating transcripts table...")
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
        
        print("🔧 Creating feedback table...")
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
        
        print("🔧 Creating dashboard_stats table...")
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
        
        print("🔧 Creating interview_analytics table...")
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
        
        # Step 5: Create additional indexes for performance
        print("🔧 Creating performance indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_email ON interview_sessions(user_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_user_email ON feedback(user_email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_dashboard_stats_user_email ON dashboard_stats(user_email)")
        
        conn.commit()
        print("✅ Database schema fixed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to fix database schema: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def test_database_connection():
    """Test if the database is working after the fix."""
    try:
        from db_utils import get_connection
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        print(f"✅ Database connection test: {count} users found")
        
        # Test if we can insert a test user
        cursor.execute("""
            INSERT INTO users (email, username, password, gmail) 
            VALUES (%s, %s, %s, %s) 
            ON CONFLICT (email) DO NOTHING
        """, ("test@example.com", "testuser", "testpass", "test@example.com"))
        
        conn.commit()
        print("✅ Database insert test: Success")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 VoiceIQ - Fix Database Schema")
    print("=" * 50)
    
    if fix_database_schema():
        print("\n🔍 Testing database connection...")
        if test_database_connection():
            print("\n🎉 Database schema fixed and working!")
        else:
            print("\n⚠️  Database schema fixed but connection test failed")
    else:
        print("\n💥 Failed to fix database schema!")
        sys.exit(1)
