#!/usr/bin/env python3
"""
Migration script to move data from SQLite to PostgreSQL
This script handles the transition from local SQLite to Render PostgreSQL
"""

import os
import sys
import sqlite3
import json
from pathlib import Path
from urllib.parse import urlparse

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def get_sqlite_connection():
    """Get connection to local SQLite database."""
    sqlite_path = backend_dir / "voiceiq.db"
    if not sqlite_path.exists():
        print(f"❌ SQLite database not found at {sqlite_path}")
        return None
    
    try:
        conn = sqlite3.connect(str(sqlite_path))
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to SQLite: {e}")
        return None

def get_postgres_connection():
    """Get connection to PostgreSQL database."""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found")
        return None
    
    try:
        import psycopg2
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        return None

def migrate_users():
    """Migrate users from SQLite to PostgreSQL."""
    sqlite_conn = get_sqlite_connection()
    postgres_conn = get_postgres_connection()
    
    if not sqlite_conn or not postgres_conn:
        return False
    
    try:
        sqlite_cursor = sqlite_conn.cursor()
        postgres_cursor = postgres_conn.cursor()
        
        # Get all users from SQLite
        sqlite_cursor.execute("SELECT * FROM users")
        users = sqlite_cursor.fetchall()
        
        print(f"📊 Found {len(users)} users to migrate")
        
        for user in users:
            try:
                # Insert into PostgreSQL
                postgres_cursor.execute("""
                    INSERT INTO users (id, name, username, gmail, email, password, phone, address, 
                                    profile_pic, role, language, created_at, last_login, is_active, 
                                    reset_token, reset_token_expires)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, user)
                
            except Exception as e:
                print(f"⚠️  Failed to migrate user {user[2] if len(user) > 2 else 'unknown'}: {e}")
        
        postgres_conn.commit()
        print("✅ Users migrated successfully")
        return True
        
    except Exception as e:
        print(f"❌ User migration failed: {e}")
        return False
    finally:
        sqlite_conn.close()
        postgres_conn.close()

def migrate_interview_sessions():
    """Migrate interview sessions from SQLite to PostgreSQL."""
    sqlite_conn = get_sqlite_connection()
    postgres_conn = get_postgres_connection()
    
    if not sqlite_conn or not postgres_conn:
        return False
    
    try:
        sqlite_cursor = sqlite_conn.cursor()
        postgres_cursor = postgres_conn.cursor()
        
        # Get all interview sessions from SQLite
        sqlite_cursor.execute("SELECT * FROM interview_sessions")
        sessions = sqlite_cursor.fetchall()
        
        print(f"📊 Found {len(sessions)} interview sessions to migrate")
        
        for session in sessions:
            try:
                # Insert into PostgreSQL
                postgres_cursor.execute("""
                    INSERT INTO interview_sessions (id, session_id, user_email, role, interview_mode, 
                                                  status, start_time, end_time, total_questions, 
                                                  questions_answered, current_question_index, 
                                                  session_data, resume_analysis, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, session)
                
            except Exception as e:
                print(f"⚠️  Failed to migrate session {session[1] if len(session) > 1 else 'unknown'}: {e}")
        
        postgres_conn.commit()
        print("✅ Interview sessions migrated successfully")
        return True
        
    except Exception as e:
        print(f"❌ Interview sessions migration failed: {e}")
        return False
    finally:
        sqlite_conn.close()
        postgres_conn.close()

def migrate_feedback():
    """Migrate feedback from SQLite to PostgreSQL."""
    sqlite_conn = get_sqlite_connection()
    postgres_conn = get_postgres_connection()
    
    if not sqlite_conn or not postgres_conn:
        return False
    
    try:
        sqlite_cursor = sqlite_conn.cursor()
        postgres_cursor = postgres_conn.cursor()
        
        # Get all feedback from SQLite
        sqlite_cursor.execute("SELECT * FROM feedback")
        feedbacks = sqlite_cursor.fetchall()
        
        print(f"📊 Found {len(feedbacks)} feedback records to migrate")
        
        for feedback in feedbacks:
            try:
                # Insert into PostgreSQL
                postgres_cursor.execute("""
                    INSERT INTO feedback (id, session_id, user_email, overall_score, technical_score,
                                       communication_score, problem_solving_score, confidence_score,
                                       categories, detailed_feedback, suggestions, strengths,
                                       areas_for_improvement, ai_generated_feedback, transcript,
                                       tts_feedback, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, feedback)
                
            except Exception as e:
                print(f"⚠️  Failed to migrate feedback {feedback[0] if len(feedback) > 0 else 'unknown'}: {e}")
        
        postgres_conn.commit()
        print("✅ Feedback migrated successfully")
        return True
        
    except Exception as e:
        print(f"❌ Feedback migration failed: {e}")
        return False
    finally:
        sqlite_conn.close()
        postgres_conn.close()

def migrate_dashboard_stats():
    """Migrate dashboard stats from SQLite to PostgreSQL."""
    sqlite_conn = get_sqlite_connection()
    postgres_conn = get_postgres_connection()
    
    if not sqlite_conn or not postgres_conn:
        return False
    
    try:
        sqlite_cursor = sqlite_conn.cursor()
        postgres_cursor = postgres_conn.cursor()
        
        # Get all dashboard stats from SQLite
        sqlite_cursor.execute("SELECT * FROM dashboard_stats")
        stats = sqlite_cursor.fetchall()
        
        print(f"📊 Found {len(stats)} dashboard stats to migrate")
        
        for stat in stats:
            try:
                # Insert into PostgreSQL
                postgres_cursor.execute("""
                    INSERT INTO dashboard_stats (id, user_email, total_interviews, completed_interviews,
                                               avg_overall_score, avg_technical_score, avg_communication_score,
                                               avg_problem_solving_score, avg_confidence_score, total_time_spent,
                                               last_interview_date, best_score, improvement_trend, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, stat)
                
            except Exception as e:
                print(f"⚠️  Failed to migrate stats {stat[0] if len(stat) > 0 else 'unknown'}: {e}")
        
        postgres_conn.commit()
        print("✅ Dashboard stats migrated successfully")
        return True
        
    except Exception as e:
        print(f"❌ Dashboard stats migration failed: {e}")
        return False
    finally:
        sqlite_conn.close()
        postgres_conn.close()

def main():
    """Main migration function."""
    print("🔄 VoiceIQ Database Migration: SQLite → PostgreSQL")
    print("=" * 60)
    
    # Check if DATABASE_URL is set
    if not os.environ.get('DATABASE_URL'):
        print("❌ DATABASE_URL not found. Cannot migrate to PostgreSQL.")
        return False
    
    # Check if SQLite database exists
    sqlite_path = backend_dir / "voiceiq.db"
    if not sqlite_path.exists():
        print("ℹ️  No SQLite database found. Skipping migration.")
        return True
    
    print(f"📊 SQLite database found: {sqlite_path}")
    print(f"📊 PostgreSQL URL: {os.environ.get('DATABASE_URL')[:30]}...")
    
    # Run migrations
    migrations = [
        ("Users", migrate_users),
        ("Interview Sessions", migrate_interview_sessions),
        ("Feedback", migrate_feedback),
        ("Dashboard Stats", migrate_dashboard_stats),
    ]
    
    success_count = 0
    for name, migration_func in migrations:
        print(f"\n🔄 Migrating {name}...")
        if migration_func():
            success_count += 1
            print(f"✅ {name} migration completed")
        else:
            print(f"❌ {name} migration failed")
    
    print(f"\n📊 Migration Summary: {success_count}/{len(migrations)} successful")
    
    if success_count == len(migrations):
        print("🎉 All migrations completed successfully!")
        return True
    else:
        print("⚠️  Some migrations failed. Check the logs above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
