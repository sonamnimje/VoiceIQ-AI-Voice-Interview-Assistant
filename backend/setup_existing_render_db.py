#!/usr/bin/env python3
"""
Setup script for existing Render PostgreSQL database
This script will initialize the database schema on your existing Render database
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def setup_existing_database():
    """Setup your existing Render PostgreSQL database with proper schema."""
    
    print("🔧 Setting up existing Render PostgreSQL database...")
    print("=" * 60)
    
    # Check if DATABASE_URL is set
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found!")
        print("Please ensure your Render service has DATABASE_URL configured.")
        print("You can find this in your Render dashboard under your database service.")
        return False
    
    print(f"📊 Using existing database: {database_url[:50]}...")
    
    try:
        # Import the PostgreSQL initialization
        from init_postgres_db import create_postgres_schema, test_connection
        
        # Test connection to your existing database
        print("🔍 Testing connection to existing database...")
        if not test_connection():
            print("❌ Failed to connect to your existing database")
            print("Please check your DATABASE_URL and ensure the database is accessible")
            return False
        
        print("✅ Successfully connected to your existing database!")
        
        # Create the schema on your existing database
        print("🔧 Creating database schema...")
        if create_postgres_schema():
            print("✅ Database schema created successfully on your existing database!")
            return True
        else:
            print("❌ Failed to create database schema")
            return False
            
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_existing_tables():
    """Check what tables already exist in your database."""
    try:
        from db_utils import get_connection
        
        conn = get_connection()
        cursor = conn.cursor()
        
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
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Failed to check existing tables: {e}")
        return False

if __name__ == "__main__":
    print("🚀 VoiceIQ - Setup Existing Render Database")
    print("=" * 50)
    
    # Check existing tables first
    print("🔍 Checking existing database structure...")
    if check_existing_tables():
        print("✅ Database connection successful!")
    else:
        print("❌ Cannot connect to database")
        sys.exit(1)
    
    # Setup the schema
    if setup_existing_database():
        print("\n🎉 Setup completed successfully!")
        print("Your existing Render database is now ready for VoiceIQ!")
    else:
        print("\n💥 Setup failed!")
        print("Please check your DATABASE_URL and try again.")
        sys.exit(1)
