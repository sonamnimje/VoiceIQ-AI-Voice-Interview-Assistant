import asyncio
import json
import logging
from typing import Optional, Dict, Any
import speech_recognition as sr
# import webrtcvad  # Temporarily commented out due to build requirements
import numpy as np
from pydub import AudioSegment
from pydub.utils import make_chunks
import tempfile
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VoiceProcessor:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        # self.vad = webrtcvad.Vad(2)  # Temporarily commented out
        self.sample_rate = 16000
        self.chunk_duration = 30  # ms
        
    async def process_audio_chunk(self, audio_data: bytes) -> Optional[str]:
        """Process a chunk of audio data and return transcribed text"""
        try:
            logger.info(f"Processing audio chunk of size: {len(audio_data)} bytes")
            
            # Check if audio data is too small to process
            if len(audio_data) < 1024:  # Less than 1KB, likely silence or very short
                return None
            
            # Convert audio data to AudioSegment
            try:
                audio_segment = AudioSegment(
                    data=audio_data,
                    sample_width=2,  # 16-bit
                    frame_rate=self.sample_rate,
                    channels=1
                )
            except Exception as e:
                logger.warning(f"Failed to create AudioSegment from raw data: {e}")
                # Try alternative approach for different audio formats
                return None
            
            # Check if audio contains speech
            if not self._has_speech(audio_segment):
                return None
                
            # Save to temporary file for speech recognition
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                audio_segment.export(temp_file.name, format="wav")
                temp_path = temp_file.name
            
            try:
                with sr.AudioFile(temp_path) as source:
                    audio = self.recognizer.record(source)
                    text = self.recognizer.recognize_google(audio)
                    return text if text.strip() else None
            except sr.UnknownValueError:
                logger.info("Speech recognition could not understand audio")
                return None
            except sr.RequestError as e:
                logger.error(f"Speech recognition service error: {e}")
                return None
            finally:
                os.unlink(temp_path)
                
        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
            return None
    
    def _has_speech(self, audio_segment: AudioSegment) -> bool:
        """Check if audio segment contains speech"""
        try:
            # Get raw audio data
            raw_audio = audio_segment.get_array_of_samples()
            if len(raw_audio) == 0:
                return False
            
            # Convert to numpy array for analysis
            audio_array = np.array(raw_audio, dtype=np.float64)
            
            # Calculate RMS (Root Mean Square) to check audio level
            rms = np.sqrt(np.mean(audio_array ** 2))
            
            # Calculate zero crossing rate as a simple speech indicator
            zero_crossings = np.sum(np.diff(np.sign(audio_array)) != 0)
            zcr = zero_crossings / len(audio_array)
            
            # Speech typically has higher RMS and moderate ZCR
            # Adjust thresholds based on your audio characteristics
            rms_threshold = 500  # Adjust based on your microphone sensitivity
            zcr_threshold_min = 0.01  # Minimum ZCR for speech
            zcr_threshold_max = 0.3   # Maximum ZCR for speech
            
            has_speech = (rms > rms_threshold and 
                         zcr_threshold_min < zcr < zcr_threshold_max)
            
            logger.debug(f"Audio analysis - RMS: {rms:.2f}, ZCR: {zcr:.4f}, Has speech: {has_speech}")
            
            return has_speech
            
        except Exception as e:
            logger.error(f"Error in speech detection: {e}")
            return False

class InterviewSession:
    def __init__(self, session_id: str, role: str):
        self.session_id = session_id
        self.role = role
        self.voice_processor = VoiceProcessor()
        self.transcript = []
        self.current_question_index = 0
        self.audio_quality_metrics = []
        
    async def process_interview_audio(self, audio_data: bytes, timestamp: float) -> Dict[str, Any]:
        """Process interview audio and return analysis results"""
        result = {
            "transcript": None,
            "audio_quality": None,
            "feedback": None
        }
        
        # Process speech recognition
        transcript = await self.voice_processor.process_audio_chunk(audio_data)
        if transcript:
            result["transcript"] = transcript
            self.transcript.append({
                "text": transcript,
                "timestamp": timestamp
            })
        
        # Analyze audio quality
        quality_metrics = self._analyze_audio_quality(audio_data)
        result["audio_quality"] = quality_metrics
        self.audio_quality_metrics.append(quality_metrics)
        
        return result
    
    def _analyze_audio_quality(self, audio_data: bytes) -> Dict[str, float]:
        """Analyze audio quality metrics"""
        try:
            # Ensure audio data length is even (16-bit samples)
            if len(audio_data) % 2 != 0:
                audio_data = audio_data[:-1]  # Remove last byte if odd length
            
            if len(audio_data) == 0:
                return {"volume": 0.0, "snr": 0.0, "clarity": 0.0, "timestamp": asyncio.get_event_loop().time()}
            
            # Convert to numpy array with proper dtype
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            
            if len(audio_array) == 0:
                return {"volume": 0.0, "snr": 0.0, "clarity": 0.0, "timestamp": asyncio.get_event_loop().time()}
            
            # Calculate metrics
            volume = np.sqrt(np.mean(audio_array.astype(np.float64)**2))
            snr = self._calculate_snr(audio_array)
            clarity = self._calculate_clarity(audio_array)
            
            return {
                "volume": float(volume),
                "snr": float(snr),
                "clarity": float(clarity),
                "timestamp": asyncio.get_event_loop().time()
            }
        except Exception as e:
            logger.error(f"Error analyzing audio quality: {e}")
            return {"volume": 0.0, "snr": 0.0, "clarity": 0.0, "timestamp": asyncio.get_event_loop().time()}
    
    def _calculate_snr(self, audio_array: np.ndarray) -> float:
        """Calculate Signal-to-Noise Ratio"""
        try:
            # Simple SNR calculation
            signal_power = np.mean(audio_array.astype(np.float64)**2)
            noise_estimate = np.percentile(audio_array.astype(np.float64)**2, 10)  # Assume 10th percentile is noise
            
            # Avoid division by zero and negative values
            if noise_estimate <= 0 or signal_power <= 0:
                return 0.0
                
            snr = 10 * np.log10(signal_power / noise_estimate)
            return max(0, snr)
        except Exception as e:
            logger.error(f"Error calculating SNR: {e}")
            return 0.0
    
    def _calculate_clarity(self, audio_array: np.ndarray) -> float:
        """Calculate audio clarity score"""
        try:
            # Ensure we have enough samples for FFT
            if len(audio_array) < 64:
                return 0.0
                
            # Calculate spectral centroid as a measure of clarity
            fft = np.fft.fft(audio_array.astype(np.float64))
            freqs = np.fft.fftfreq(len(audio_array))
            magnitude = np.abs(fft)
            
            # Avoid division by zero
            total_magnitude = np.sum(magnitude)
            if total_magnitude <= 0:
                return 0.0
            
            # Spectral centroid
            centroid = np.sum(freqs * magnitude) / total_magnitude
            return min(1.0, max(0.0, abs(centroid) / 8000))  # Normalize to 0-1
        except Exception as e:
            logger.error(f"Error calculating clarity: {e}")
            return 0.0
    
    def get_session_summary(self) -> Dict[str, Any]:
        """Get comprehensive session summary"""
        return {
            "session_id": self.session_id,
            "role": self.role,
            "total_questions": len(self.transcript),
            "average_audio_quality": np.mean([m["clarity"] for m in self.audio_quality_metrics]) if self.audio_quality_metrics else 0,
            "transcript": self.transcript,
            "audio_metrics": self.audio_quality_metrics
        }

# Global session storage
interview_sessions: Dict[str, InterviewSession] = {}

def get_or_create_session(session_id: str, role: str) -> InterviewSession:
    """Get existing session or create new one"""
    if session_id not in interview_sessions:
        interview_sessions[session_id] = InterviewSession(session_id, role)
    return interview_sessions[session_id] 