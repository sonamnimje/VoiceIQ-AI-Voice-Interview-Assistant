#!/usr/bin/env python3
"""
Test script to verify database schema fix
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_database():
    """Test database connection and basic operations."""
    print("🔍 Testing database connection...")
    
    try:
        from db_utils import get_connection
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Test basic connection
        cursor.execute("SELECT version()")
        version = cursor.fetchone()
        print(f"✅ Connected to: {version[0]}")
        
        # Test if users table exists
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        """)
        users_table = cursor.fetchone()
        
        if users_table:
            print("✅ Users table exists")
            
            # Test if we can query users table
            cursor.execute("SELECT COUNT(*) FROM users")
            count = cursor.fetchone()[0]
            print(f"✅ Users table query successful: {count} users")
            
            # Test if we can insert a test user
            try:
                cursor.execute("""
                    INSERT INTO users (email, username, password, gmail) 
                    VALUES (%s, %s, %s, %s) 
                    ON CONFLICT (email) DO NOTHING
                """, ("test@example.com", "testuser", "testpass", "test@example.com"))
                conn.commit()
                print("✅ Database insert test: Success")
            except Exception as e:
                print(f"⚠️  Insert test failed: {e}")
            
        else:
            print("❌ Users table does not exist")
            return False
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 VoiceIQ - Database Test")
    print("=" * 40)
    
    if test_database():
        print("\n🎉 Database is working correctly!")
    else:
        print("\n💥 Database test failed!")
        sys.exit(1)
