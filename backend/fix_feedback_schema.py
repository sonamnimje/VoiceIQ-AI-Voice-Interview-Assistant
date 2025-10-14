#!/usr/bin/env python3
"""
Database migration script to fix the feedback table schema.
This script adds the missing 'transcript' and 'tts_feedback' columns to the feedback table.
"""

import sqlite3
import os
from db_utils import get_connection

DB_PATH = "database.db"

def fix_feedback_schema():
    """Fix the feedback table schema by adding missing columns"""
    if not os.path.exists(DB_PATH):
        print(f"❌ Database file {DB_PATH} not found!")
        return False
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        print("🔧 Fixing feedback table schema...")
        
        # Check if feedback table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='feedback'")
        if not cursor.fetchone():
            print("❌ Feedback table does not exist! Please run the database initialization first.")
            return False
        
        # Check current schema
        cursor.execute("PRAGMA table_info(feedback)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Current feedback table columns: {columns}")
        
        # Add missing columns
        missing_columns = []
        
        if 'transcript' not in columns:
            print("➕ Adding 'transcript' column...")
            cursor.execute("ALTER TABLE feedback ADD COLUMN transcript TEXT")
            missing_columns.append('transcript')
        
        if 'tts_feedback' not in columns:
            print("➕ Adding 'tts_feedback' column...")
            cursor.execute("ALTER TABLE feedback ADD COLUMN tts_feedback TEXT")
            missing_columns.append('tts_feedback')
        
        if missing_columns:
            conn.commit()
            print(f"✅ Successfully added columns: {missing_columns}")
        else:
            print("✅ All required columns already exist!")
        
        # Verify the fix
        cursor.execute("PRAGMA table_info(feedback)")
        updated_columns = [row[1] for row in cursor.fetchall()]
        print(f"Updated feedback table columns: {updated_columns}")
        
        # Check if there's any existing feedback data
        cursor.execute("SELECT COUNT(*) FROM feedback")
        count = cursor.fetchone()[0]
        print(f"📊 Found {count} existing feedback records")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing feedback schema: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def test_feedback_functions():
    """Test the feedback functions to ensure they work correctly"""
    print("\n🧪 Testing feedback functions...")
    
    try:
        from db_utils import get_feedback, save_feedback
        import json
        
        # Test saving feedback
        test_email = "test@example.com"
        test_session_id = "test-session-123"
        test_transcript = json.dumps([
            {"time": "00:00", "text": "Hello, how are you?", "speaker": "ai"},
            {"time": "00:05", "text": "I'm doing well, thank you!", "speaker": "user"}
        ])
        
        save_feedback(
            email=test_email,
            session_id=test_session_id,
            overall_score=8.5,
            categories=json.dumps({"technical": 8, "communication": 9}),
            suggestions=json.dumps(["Great job!", "Keep practicing"]),
            transcript=test_transcript,
            tts_feedback="Excellent performance overall!"
        )
        print("✅ save_feedback() test passed")
        
        # Test getting feedback
        feedback = get_feedback(test_email, test_session_id)
        if feedback and feedback.get('transcript'):
            print("✅ get_feedback() test passed")
            print(f"Retrieved transcript: {feedback['transcript'][:100]}...")
        else:
            print("❌ get_feedback() test failed - no transcript found")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing feedback functions: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting feedback schema fix...")
    
    if fix_feedback_schema():
        print("\n✅ Schema fix completed successfully!")
        
        if test_feedback_functions():
            print("\n🎉 All tests passed! The feedback system should now work correctly.")
        else:
            print("\n⚠️  Schema fix completed but function tests failed. Please check the implementation.")
    else:
        print("\n❌ Schema fix failed! Please check the error messages above.") 