#!/usr/bin/env python3
"""
Setup script for Render PostgreSQL database
This script will initialize the database schema on Render
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def setup_render_database():
    """Setup Render PostgreSQL database with proper schema."""
    
    print("🚀 Setting up Render PostgreSQL Database")
    print("=" * 50)
    
    # Check if DATABASE_URL is set
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set!")
        print("Please set DATABASE_URL in your Render service environment variables.")
        return False
    
    print(f"📊 Database URL found: {database_url[:50]}...")
    
    try:
        # Import and run the PostgreSQL initialization
        from init_postgres_db import create_postgres_schema, test_connection
        
        # Test connection first
        if not test_connection():
            print("❌ Failed to connect to database")
            return False
        
        # Create schema
        if create_postgres_schema():
            print("✅ Database setup completed successfully!")
            return True
        else:
            print("❌ Failed to create database schema")
            return False
            
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = setup_render_database()
    sys.exit(0 if success else 1)
