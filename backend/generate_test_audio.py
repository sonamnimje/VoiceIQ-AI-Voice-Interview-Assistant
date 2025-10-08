""
Generate a test WAV file with a simple sine wave
"""
import numpy as np
import soundfile as sf
import os

# Audio parameters
SAMPLE_RATE = 16000  # Hz
DURATION = 3.0  # seconds
FREQUENCY = 440  # Hz (A4 note)
OUTPUT_FILE = "test_audio.wav"

# Generate time array
t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), False)

# Generate sine wave
audio = 0.5 * np.sin(2 * np.pi * FREQUENCY * t)

# Save as WAV file
sf.write(OUTPUT_FILE, audio, SAMPLE_RATE)
print(f"Generated test audio file: {os.path.abspath(OUTPUT_FILE)}")
print(f"Duration: {DURATION} seconds")
print(f"Sample rate: {SAMPLE_RATE} Hz")
print(f"Frequency: {FREQUENCY} Hz")
print("\nYou can now run the WebSocket test script.")
