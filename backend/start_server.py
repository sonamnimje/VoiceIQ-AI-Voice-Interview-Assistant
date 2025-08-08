#!/usr/bin/env python3
"""
Simple startup script for the AI Voice Interview backend server
"""

import sys
import os
import logging
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    try:
        logger.info("🚀 Starting AI Voice Interview Backend Server...")
        
        # Check if required files exist
        required_files = ['main.py', 'db_utils.py', 'voice_processor.py']
        for file in required_files:
            if not os.path.exists(file):
                logger.error(f"❌ Required file not found: {file}")
                return 1
        
        # Import and run the server
        from main import socket_app
        import uvicorn
        
        logger.info("✅ All dependencies loaded successfully")
        logger.info("🌐 Server will be available at: http://localhost:8000")
        logger.info("🔌 Socket.IO endpoint: http://localhost:8000")
        logger.info("📊 API documentation: http://localhost:8000/docs")
        
        # Start the server
        uvicorn.run(
            socket_app, 
            host="0.0.0.0", 
            port=8000,
            log_level="info",
            reload=True
        )
        
    except ImportError as e:
        logger.error(f"❌ Import error: {e}")
        logger.error("Please make sure all required packages are installed:")
        logger.error("pip install -r requirements.txt")
        return 1
        
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 