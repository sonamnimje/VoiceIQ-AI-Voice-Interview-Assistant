"""
Generate a test WAV file with a simple sine wave
"""
import numpy as np
import os

try:
    import soundfile as sf
except Exception:
    sf = None

# Audio parameters
SAMPLE_RATE = 16000  # Hz
DURATION = 3.0  # seconds
FREQUENCY = 440  # Hz (A4 note)
OUTPUT_FILE = "test_audio.wav"

def generate_sine_wav(output_file=OUTPUT_FILE, sample_rate=SAMPLE_RATE, duration=DURATION, frequency=FREQUENCY):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    audio = 0.5 * np.sin(2 * np.pi * frequency * t)

    if sf:
        sf.write(output_file, audio, sample_rate)
    else:
        # Fallback to scipy if soundfile is not installed
        try:
            from scipy.io.wavfile import write as wav_write
            wav_write(output_file, sample_rate, (audio * 32767).astype('int16'))
        except Exception as e:
            raise RuntimeError("Neither soundfile nor scipy.io.wavfile available or write failed") from e

def main():
    try:
        generate_sine_wav()
        print(f"Generated test audio file: {os.path.abspath(OUTPUT_FILE)}")
        print(f"Duration: {DURATION} seconds")
        print(f"Sample rate: {SAMPLE_RATE} Hz")
        print(f"Frequency: {FREQUENCY} Hz")
        print("\nYou can now run the WebSocket test script.")
    except Exception as e:
        print(f"Failed to generate test audio: {e}")

if __name__ == "__main__":
    main()
