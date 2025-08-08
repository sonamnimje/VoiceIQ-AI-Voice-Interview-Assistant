#!/usr/bin/env python3
"""
WebSocket Connection Diagnostic Script
"""

import asyncio
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

def test_basic_socketio():
    """Test basic Socket.IO functionality"""
    print("🔍 Testing basic Socket.IO setup...")
    
    try:
        # Create Socket.IO server
        sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins=["*"]
        )
        print("✅ Socket.IO server created successfully")
        
        # Create FastAPI app
        app = FastAPI()
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Create ASGI app
        socket_app = socketio.ASGIApp(sio, app)
        print("✅ ASGI app created successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in basic setup: {e}")
        return False

def test_socketio_events():
    """Test Socket.IO event handlers"""
    print("\n🔍 Testing Socket.IO event handlers...")
    
    try:
        sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins=["*"]
        )
        
        @sio.event
        async def connect(sid, environ):
            print(f"✅ Connect event triggered for {sid}")
            return True
        
        @sio.event
        async def disconnect(sid):
            print(f"✅ Disconnect event triggered for {sid}")
            return True
        
        @sio.event
        async def test(sid, data):
            print(f"✅ Test event triggered for {sid} with data: {data}")
            return True
        
        print("✅ All event handlers registered successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error in event handlers: {e}")
        return False

def test_imports():
    """Test all required imports"""
    print("🔍 Testing imports...")
    
    try:
        import socketio
        import fastapi
        import uvicorn
        import asyncio
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def main():
    print("🔧 WebSocket Connection Diagnostic")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import test failed. Please check your dependencies.")
        return False
    
    # Test basic setup
    if not test_basic_socketio():
        print("\n❌ Basic Socket.IO setup failed.")
        return False
    
    # Test event handlers
    if not test_socketio_events():
        print("\n❌ Event handler test failed.")
        return False
    
    print("\n🎉 All tests passed!")
    print("Your Socket.IO setup should work correctly.")
    print("\n📋 Next steps:")
    print("1. Restart your backend server")
    print("2. Test the connection in your browser")
    print("3. Check browser console for connection messages")
    
    return True

if __name__ == "__main__":
    main() 