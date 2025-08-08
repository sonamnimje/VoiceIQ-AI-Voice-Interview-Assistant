#!/usr/bin/env python3
"""
Test script for voice processing functionality
"""

import asyncio
import logging
import numpy as np
from voice_processor import VoiceProcessor, InterviewSession

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_voice_processor():
    """Test the voice processor with synthetic audio data"""
    
    # Create a test audio signal (sine wave)
    sample_rate = 16000
    duration = 1.0  # 1 second
    frequency = 440  # A4 note
    
    # Generate sine wave
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    audio_signal = np.sin(2 * np.pi * frequency * t) * 0.5
    
    # Convert to 16-bit PCM
    audio_data = (audio_signal * 32767).astype(np.int16).tobytes()
    
    print(f"Generated test audio: {len(audio_data)} bytes")
    
    # Test voice processor
    processor = VoiceProcessor()
    
    # Test audio quality analysis
    print("\n=== Testing Audio Quality Analysis ===")
    try:
        session = InterviewSession("test_session", "Software Engineer")
        quality = session._analyze_audio_quality(audio_data)
        print(f"Audio Quality: {quality}")
    except Exception as e:
        print(f"Audio quality analysis failed: {e}")
    
    # Test speech detection
    print("\n=== Testing Speech Detection ===")
    try:
        from pydub import AudioSegment
        audio_segment = AudioSegment(
            data=audio_data,
            sample_width=2,
            frame_rate=sample_rate,
            channels=1
        )
        has_speech = processor._has_speech(audio_segment)
        print(f"Has speech: {has_speech}")
    except Exception as e:
        print(f"Speech detection failed: {e}")
    
    # Test interview session
    print("\n=== Testing Interview Session ===")
    try:
        session = InterviewSession("test_session", "Software Engineer")
        result = await session.process_interview_audio(audio_data, 0.0)
        print(f"Session result: {result}")
    except Exception as e:
        print(f"Session processing failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_voice_processor()) 