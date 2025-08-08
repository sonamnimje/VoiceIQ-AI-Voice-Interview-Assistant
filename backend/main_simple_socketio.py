#!/usr/bin/env python3
"""
Simplified main.py with Socket.IO for testing
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socketio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Create ASGI app with Socket.IO
socket_app = socketio.ASGIApp(sio, app, socketio_path='socket.io')

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Handle Socket.IO client connection"""
    try:
        logger.info(f"Socket.IO client connected: {sid}")
        await sio.emit('connect_response', {'status': 'connected', 'sid': sid}, room=sid)
        logger.info(f"Connect response sent to client {sid}")
    except Exception as e:
        logger.error(f"Error in Socket.IO connect: {e}")
        raise

@sio.event
async def disconnect(sid):
    """Handle Socket.IO client disconnection"""
    logger.info(f"Socket.IO client disconnected: {sid}")

@sio.event
async def test(sid, data):
    """Handle test event from client"""
    logger.info(f"Test event received from {sid}: {data}")
    await sio.emit('test_response', {'status': 'test_success', 'data': data}, room=sid)

@sio.event
async def voice(sid, data):
    """Handle voice data from client"""
    logger.info(f"Voice data received from {sid}: {len(data) if data else 0} bytes")
    await sio.emit('voice_result', {'transcript': 'Test transcript', 'audio_quality': 'good'}, room=sid)

# FastAPI routes
@app.get("/")
def root():
    return {
        "message": "API is running!",
        "socketio_status": "enabled",
        "socketio_endpoint": "/socket.io/"
    }

@app.get("/socketio-test")
def socketio_test():
    """Test endpoint to verify Socket.IO server is running"""
    return {
        "status": "Socket.IO server is running",
        "endpoint": "/socket.io/",
        "cors_enabled": True,
        "allowed_origins": "*",
        "server_info": {
            "async_mode": sio.async_mode,
            "cors_allowed_origins": sio.cors_allowed_origins,
            "logger_enabled": sio.logger,
            "engineio_logger_enabled": sio.engineio_logger
        }
    }

@app.post("/login")
async def login(request: Request):
    """Simple login endpoint for testing"""
    data = await request.json()
    return {"success": True, "message": "Login successful"}

if __name__ == "__main__":
    import uvicorn
    print("Starting simplified Socket.IO server...")
    uvicorn.run(socket_app, host="0.0.0.0", port=8000) 