#!/usr/bin/env python3
"""
Simple Socket.IO test script
"""

import socketio
import asyncio

def test_socketio_imports():
    """Test if Socket.IO imports work correctly"""
    try:
        print("Testing Socket.IO imports...")
        
        # Test basic Socket.IO server creation
        sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins="*"
        )
        print("✅ Socket.IO server created successfully")
        
        # Test server attributes
        print(f"Async mode: {sio.async_mode}")
        print(f"CORS origins: {getattr(sio, 'cors_allowed_origins', 'Not available')}")
        print(f"Logger enabled: {getattr(sio, 'logger', 'Not available')}")
        print(f"EngineIO logger enabled: {getattr(sio, 'engineio_logger', 'Not available')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating Socket.IO server: {e}")
        return False

def test_socketio_events():
    """Test Socket.IO event handlers"""
    try:
        print("\nTesting Socket.IO event handlers...")
        
        sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins="*"
        )
        
        @sio.event
        async def connect(sid, environ):
            print(f"✅ Connect event handler works")
            return True
        
        @sio.event
        async def disconnect(sid):
            print(f"✅ Disconnect event handler works")
            return True
        
        @sio.event
        async def test(sid, data):
            print(f"✅ Test event handler works")
            return True
        
        print("✅ All event handlers created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error creating event handlers: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Socket.IO Test Script")
    print("=" * 40)
    
    # Test imports
    if test_socketio_imports():
        print("\n✅ Socket.IO imports test passed")
    else:
        print("\n❌ Socket.IO imports test failed")
        exit(1)
    
    # Test event handlers
    if test_socketio_events():
        print("\n✅ Socket.IO event handlers test passed")
    else:
        print("\n❌ Socket.IO event handlers test failed")
        exit(1)
    
    print("\n🎉 All Socket.IO tests passed!")
    print("The Socket.IO setup should work correctly.") 