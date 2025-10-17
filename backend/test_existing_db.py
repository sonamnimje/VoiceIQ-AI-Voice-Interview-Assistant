#!/usr/bin/env python3
"""
Test script for existing Render PostgreSQL database
This script tests the connection to your existing database
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_database_connection():
    """Test connection to existing Render database."""
    print("🔍 Testing connection to your existing Render database...")
    print("=" * 60)
    
    # Check if DATABASE_URL is set
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found!")
        print("Please set DATABASE_URL to your Render database connection string.")
        return False
    
    print(f"📊 Database URL: {database_url[:50]}...")
    
    try:
        from db_utils import get_connection
        
        # Test connection
        conn = get_connection()
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT version()")
        version = cursor.fetchone()
        print(f"✅ Connected to PostgreSQL: {version[0]}")
        
        # Check existing tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        
        print(f"📊 Found {len(tables)} existing tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Test if we can create a simple table (permissions check)
        try:
            cursor.execute("CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, test_col TEXT)")
            cursor.execute("DROP TABLE test_connection")
            print("✅ Database permissions: OK (can create/drop tables)")
        except Exception as e:
            print(f"⚠️  Database permissions: Limited - {e}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_required_tables():
    """Check if required tables exist."""
    try:
        from db_utils import get_connection
        
        conn = get_connection()
        cursor = conn.cursor()
        
        required_tables = [
            'users', 'interview_sessions', 'interview_questions', 
            'user_responses', 'transcripts', 'feedback', 
            'dashboard_stats', 'interview_analytics'
        ]
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN %s
        """, (tuple(required_tables),))
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        print(f"\n📊 Required tables status:")
        for table in required_tables:
            status = "✅" if table in existing_tables else "❌"
            print(f"   {status} {table}")
        
        missing_tables = set(required_tables) - set(existing_tables)
        if missing_tables:
            print(f"\n⚠️  Missing tables: {', '.join(missing_tables)}")
            print("Run setup_existing_render_db.py to create them")
        else:
            print("\n✅ All required tables exist!")
        
        conn.close()
        return len(missing_tables) == 0
        
    except Exception as e:
        print(f"❌ Failed to check tables: {e}")
        return False

def main():
    """Main test function."""
    print("🚀 VoiceIQ - Test Existing Render Database")
    print("=" * 50)
    
    # Test connection
    if not test_database_connection():
        print("\n💥 Database connection failed!")
        print("Please check your DATABASE_URL and database status in Render dashboard.")
        return False
    
    # Check required tables
    tables_ok = check_required_tables()
    
    print("\n" + "=" * 50)
    print("🎯 Test Results")
    print("=" * 50)
    
    if tables_ok:
        print("🎉 Your existing database is ready for VoiceIQ!")
        print("You can deploy your application now.")
    else:
        print("⚠️  Some tables are missing.")
        print("Run: python setup_existing_render_db.py")
        print("Then redeploy your application.")
    
    return tables_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
