"""
Test WebSocket connection and voice functionality
"""
import asyncio
import base64
import json
import logging
import os
import socketio
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket server URL
SERVER_URL = "http://localhost:8000"

# Sample audio file path (you may need to adjust this)
SAMPLE_AUDIO_PATH = "test_audio.wav"

class VoiceTester:
    def __init__(self):
        self.sio = socketio.AsyncClient()
        self.setup_event_handlers()
        self.connected = False
        self.session_id = "test_session_123"
        self.role = "Software Engineer"

    def setup_event_handlers(self):
        @self.sio.event
        async def connect():
            logger.info("Connected to WebSocket server")
            self.connected = True

        @self.sio.event
        async def connect_response(data):
            logger.info(f"Connect response: {data}")

        @self.sio.event
        async def voice_result(data):
            logger.info(f"Received voice result: {data}")

        @self.sio.event
        async def error(data):
            logger.error(f"Error from server: {data}")

        @self.sio.event
        async def disconnect():
            logger.info("Disconnected from WebSocket server")
            self.connected = False

    async def connect(self):
        try:
            await self.sio.connect(SERVER_URL)
            return True
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket server: {e}")
            return False

    async def send_voice_data(self, audio_data):
        if not self.connected:
            logger.error("Not connected to WebSocket server")
            return False

        try:
            # Encode audio data as base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Prepare voice data
            voice_data = {
                "session_id": self.session_id,
                "role": self.role,
                "audio_data": audio_base64
            }
            
            # Send voice data
            await self.sio.emit('voice', voice_data)
            logger.info("Voice data sent to server")
            return True
            
        except Exception as e:
            logger.error(f"Error sending voice data: {e}")
            return False

    async def disconnect(self):
        if self.connected:
            await self.sio.disconnect()

async def main():
    # Create test audio file if it doesn't exist
    if not os.path.exists(SAMPLE_AUDIO_PATH):
        logger.warning(f"Test audio file not found at {SAMPLE_AUDIO_PATH}")
        logger.info("Please place a WAV file at this location and try again")
        return

    # Read test audio file
    try:
        with open(SAMPLE_AUDIO_PATH, 'rb') as f:
            audio_data = f.read()
        logger.info(f"Read {len(audio_data)} bytes from {SAMPLE_AUDIO_PATH}")
    except Exception as e:
        logger.error(f"Failed to read audio file: {e}")
        return

    # Create and run tester
    tester = VoiceTester()
    
    try:
        # Connect to WebSocket server
        logger.info(f"Connecting to WebSocket server at {SERVER_URL}")
        if not await tester.connect():
            return

        # Wait a bit for connection to establish
        await asyncio.sleep(1)

        # Send test voice data
        logger.info("Sending voice data...")
        if await tester.send_voice_data(audio_data):
            # Wait for response
            logger.info("Waiting for response... (press Ctrl+C to exit)")
            await asyncio.sleep(5)  # Wait for 5 seconds for response

    except KeyboardInterrupt:
        logger.info("Test interrupted by user")
    except Exception as e:
        logger.error(f"Error during test: {e}")
    finally:
        # Clean up
        await tester.disconnect()
        logger.info("Test completed")

if __name__ == "__main__":
    asyncio.run(main())
