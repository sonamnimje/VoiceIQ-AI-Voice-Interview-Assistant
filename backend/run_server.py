#!/usr/bin/env python3
"""
Simple server startup script
"""

import uvicorn
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    print("🚀 Starting AI Voice Interview Backend Server...")
    
    try:
        # Import the socket app
        from main import socket_app
        
        print("✅ Server imported successfully")
        print("🌐 Starting server on http://0.0.0.0:8000")
        print("🔌 Socket.IO endpoint: http://0.0.0.0:8000")
        print("📊 API documentation: http://0.0.0.0:8000/docs")
        print("📍 Accessible via:")
        print("   - http://localhost:8000")
        print("   - http://192.168.29.164:8000")
        print("\nPress Ctrl+C to stop the server")
        
        # Start the server
        uvicorn.run(
            socket_app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=False,
            access_log=True
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 