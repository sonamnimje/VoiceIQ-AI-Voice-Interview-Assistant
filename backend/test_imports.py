#!/usr/bin/env python3
"""
Test script to check if all imports work correctly
"""

import sys
import os

def test_imports():
    print("Testing imports...")
    
    try:
        print("✓ Importing FastAPI...")
        from fastapi import FastAPI
        print("✓ FastAPI imported successfully")
    except ImportError as e:
        print(f"✗ FastAPI import failed: {e}")
        return False
    
    try:
        print("✓ Importing socketio...")
        import socketio
        print("✓ SocketIO imported successfully")
    except ImportError as e:
        print(f"✗ SocketIO import failed: {e}")
        return False
    
    try:
        print("✓ Importing uvicorn...")
        import uvicorn
        print("✓ Uvicorn imported successfully")
    except ImportError as e:
        print(f"✗ Uvicorn import failed: {e}")
        return False
    
    try:
        print("✓ Importing db_utils...")
        from db_utils import init_db
        print("✓ db_utils imported successfully")
    except ImportError as e:
        print(f"✗ db_utils import failed: {e}")
        return False
    
    try:
        print("✓ Importing voice_processor...")
        from voice_processor import get_or_create_session
        print("✓ voice_processor imported successfully")
    except ImportError as e:
        print(f"✗ voice_processor import failed: {e}")
        return False
    
    try:
        print("✓ Importing main module...")
        from main import socket_app
        print("✓ Main module imported successfully")
    except ImportError as e:
        print(f"✗ Main module import failed: {e}")
        return False
    
    print("\n✅ All imports successful!")
    return True

if __name__ == "__main__":
    success = test_imports()
    if success:
        print("\n🚀 Ready to start server!")
    else:
        print("\n❌ Import issues detected. Please check dependencies.")
        sys.exit(1) 