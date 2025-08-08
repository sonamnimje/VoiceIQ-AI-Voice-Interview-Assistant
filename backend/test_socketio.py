#!/usr/bin/env python3
"""
Simple Socket.IO test server
"""

import asyncio
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

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
socket_app = socketio.ASGIApp(sio, app)

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit('message', {'data': 'Connected!'}, room=sid)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def message(sid, data):
    print(f"Message from {sid}: {data}")
    await sio.emit('message', {'data': f'Echo: {data}'}, room=sid)

@app.get("/")
def root():
    return {"message": "Socket.IO test server is running"}

if __name__ == "__main__":
    print("Starting Socket.IO test server...")
    uvicorn.run(socket_app, host="0.0.0.0", port=8001) 