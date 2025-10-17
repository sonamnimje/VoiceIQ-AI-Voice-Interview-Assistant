#!/usr/bin/env python3
"""
Deployment script for Render PostgreSQL setup
This script should be run on Render to initialize the database
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    print("🚀 VoiceIQ Render Database Deployment")
    print("=" * 50)
    
    # Check if we're on Render
    if not os.environ.get('RENDER'):
        print("⚠️  Not running on Render, skipping deployment setup")
        return True
    
    # Check for DATABASE_URL
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        print("Please ensure your Render service has DATABASE_URL configured")
        return False
    
    print(f"📊 Found DATABASE_URL: {database_url[:30]}...")
    
    try:
        # Run the PostgreSQL setup
        result = subprocess.run([
            sys.executable, 'setup_render_db.py'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Database setup completed successfully!")
            print(result.stdout)
            return True
        else:
            print("❌ Database setup failed!")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
