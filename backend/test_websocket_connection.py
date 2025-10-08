"""
Test WebSocket connection to the backend
"""
import asyncio
import websockets
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket server URL
WS_URL = "ws://localhost:8000/ws/test_client"

async def test_websocket_connection():
    """Test WebSocket connection and basic echo functionality"""
    try:
        logger.info(f"Connecting to WebSocket server at {WS_URL}")
        
        async with websockets.connect(WS_URL) as websocket:
            logger.info("Successfully connected to WebSocket server")
            
            # Test echo functionality
            test_message = {"type": "test", "message": "Hello, WebSocket!"}
            logger.info(f"Sending test message: {test_message}")
            
            await websocket.send(json.dumps(test_message))
            logger.info("Waiting for response...")
            
            # Wait for response with timeout
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                logger.info(f"Received response: {response}")
                return True
            except asyncio.TimeoutError:
                logger.error("No response received within timeout period")
                return False
                
    except Exception as e:
        logger.error(f"WebSocket connection failed: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.get_event_loop().run_until_complete(test_websocket_connection())
    if result:
        logger.info("✅ WebSocket test completed successfully")
    else:
        logger.error("❌ WebSocket test failed")
