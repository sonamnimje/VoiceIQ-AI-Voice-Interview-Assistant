"""
Simple WebSocket connection test
"""
import asyncio
import websockets
import json

async def test_connection():
    uri = "ws://localhost:8000/ws"
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            
            # Send a test message
            test_msg = {"type": "test", "message": "Hello, WebSocket!"}
            await websocket.send(json.dumps(test_msg))
            print(f"Sent: {test_msg}")
            
            # Wait for a response
            response = await websocket.recv()
            print(f"Received: {response}")
            
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure the WebSocket server is running and accessible.")

if __name__ == "__main__":
    asyncio.get_event_loop().run_until_complete(test_connection())
