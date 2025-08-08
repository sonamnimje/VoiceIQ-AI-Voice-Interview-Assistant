import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import config from '../config';
import './VoiceInterview.css';

const VoiceInterview = ({ sessionId, role, onTranscriptUpdate, onAudioQualityUpdate, selectedAudioDevice }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioQuality, setAudioQuality] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    
    const socketRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneRef = useRef(null);
    
    const [status, setStatus] = useState('idle');
    const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isAudioTesting, setIsAudioTesting] = useState(false);
    
    // AI Interviewer state
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sample interview questions for different roles
    const interviewQuestions = {
        'Software Engineer': [
            "Can you tell me about a challenging technical problem you solved recently?",
            "How do you approach debugging complex issues in production?",
            "What's your experience with version control systems like Git?",
            "How do you stay updated with the latest technologies?",
            "Can you explain the difference between synchronous and asynchronous programming?"
        ],
        'Data Scientist': [
            "What machine learning algorithms are you most familiar with?",
            "How do you handle missing data in your datasets?",
            "Can you explain the bias-variance tradeoff?",
            "What's your experience with data visualization tools?",
            "How do you validate your models?"
        ],
        'Product Manager': [
            "How do you prioritize features in a product roadmap?",
            "Can you walk me through a product launch you managed?",
            "How do you gather and analyze user feedback?",
            "What metrics do you track to measure product success?",
            "How do you handle competing stakeholder requirements?"
        ],
        'UX Designer': [
            "Can you walk me through your design process?",
            "How do you conduct user research?",
            "What tools do you use for prototyping?",
            "How do you handle feedback from stakeholders?",
            "Can you explain the difference between UX and UI design?"
        ],
        'DevOps Engineer': [
            "What CI/CD tools are you familiar with?",
            "How do you handle infrastructure as code?",
            "What's your experience with containerization?",
            "How do you monitor and troubleshoot production systems?",
            "What's your approach to security in DevOps?"
        ]
    };

    // Default questions for any role
    const defaultQuestions = [
        "Tell me about yourself and your background.",
        "What are your strengths and weaknesses?",
        "Where do you see yourself in 5 years?",
        "Why are you interested in this role?",
        "What's your experience with teamwork and collaboration?"
    ];

    const getQuestionsForRole = (role) => {
        return interviewQuestions[role] || defaultQuestions;
    };

    const generateAIResponse = async (userAnswer, question) => {
        try {
            setIsProcessing(true);
            
            // Simulate AI processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate contextual response based on the question and answer
            let response = '';
            
            if (question.includes('challenging') || question.includes('problem')) {
                response = "That's a great example of problem-solving. I can see you have strong analytical skills. What was the most important lesson you learned from that experience?";
            } else if (question.includes('experience') || question.includes('background')) {
                response = "Thank you for sharing that background. Your experience seems well-aligned with what we're looking for. Let me ask you about a specific technical challenge...";
            } else if (question.includes('strengths') || question.includes('weaknesses')) {
                response = "I appreciate your honesty about your areas for growth. It shows self-awareness. How do you work on improving those areas?";
            } else if (question.includes('5 years') || question.includes('future')) {
                response = "That's an interesting career path you've outlined. How do you think this role fits into that vision?";
            } else if (question.includes('teamwork') || question.includes('collaboration')) {
                response = "Collaboration is indeed crucial in our environment. Can you give me a specific example of a successful team project you worked on?";
            } else {
                response = "That's very insightful. Your approach shows good understanding of the field. Let me ask you about another aspect...";
            }
            
            setAiResponse(response);
            
            // Move to next question after a delay
            setTimeout(() => {
                const questions = getQuestionsForRole(role);
                const nextIndex = (questionIndex + 1) % questions.length;
                setQuestionIndex(nextIndex);
                setCurrentQuestion(questions[nextIndex]);
                setAiResponse('');
            }, 3000);
            
        } catch (error) {
            console.error('Error generating AI response:', error);
            setAiResponse("Thank you for that answer. Let me ask you another question...");
        } finally {
            setIsProcessing(false);
        }
    };

    // Audio testing functionality
    const testAudioDevice = async () => {
        if (!selectedAudioDevice) {
            setError('Please select an audio device first');
            return;
        }

        try {
            setIsAudioTesting(true);
            setError(null);
            
            // Create audio context for level monitoring
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context if suspended
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }
            
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            // Try with exact device first, fallback to preferred device, then default
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: selectedAudioDevice } }
                });
            } catch (exactErr) {
                console.warn('Exact device failed, trying preferred:', exactErr);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: { deviceId: selectedAudioDevice }
                    });
                } catch (preferredErr) {
                    console.warn('Preferred device failed, trying default:', preferredErr);
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });
                }
            }

            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
            microphoneRef.current.connect(analyserRef.current);

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            
            const updateAudioLevel = () => {
                if (!isAudioTesting) return;
                
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(average);
                
                requestAnimationFrame(updateAudioLevel);
            };
            
            updateAudioLevel();
        } catch (err) {
            console.error('Error testing audio:', err);
            setError(`Audio test failed: ${err.message}`);
            setIsAudioTesting(false);
        }
    };

    const stopAudioTest = () => {
        setIsAudioTesting(false);
        setAudioLevel(0);
        
        if (microphoneRef.current) {
            microphoneRef.current.disconnect();
            microphoneRef.current = null;
        }
    };

    // Fallback mode for when backend is not available
    const handleManualResponse = () => {
        console.log('🎭 Demo mode triggered, isConnected:', isConnected);
        // Simulate user response for demo purposes
        const demoResponse = "I have experience with various technologies and enjoy solving complex problems. I'm passionate about learning new things and working in collaborative environments.";
        console.log('📝 Adding demo response to transcript:', demoResponse);
        setTranscript(prev => {
            const newTranscript = prev + ' ' + demoResponse;
            console.log('📝 New transcript after demo:', newTranscript);
            return newTranscript;
        });
        generateAIResponse(demoResponse, currentQuestion);
    };

    const initializeSocketConnection = () => {
        try {
            console.log('Attempting to connect to Socket.IO server at:', config.SOCKET_URL);
            
            // Clean up existing connection
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            
            socketRef.current = io(config.SOCKET_URL, {
                transports: ['polling', 'websocket'],
                timeout: 20000,
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                forceNew: true,
                withCredentials: false,
                upgrade: true,
                rememberUpgrade: true,
                autoConnect: true
            });
            
            socketRef.current.on('connect', () => {
                setIsConnected(true);
                setConnectionAttempts(0);
                console.log('✅ Connected to interview server');
                console.log('Socket ID:', socketRef.current.id);
                
                // Start with first question
                const questions = getQuestionsForRole(role);
                if (questions.length > 0) {
                    setCurrentQuestion(questions[0]);
                    console.log('📝 Set initial question:', questions[0]);
                }
                
                // Test the connection by emitting a test event
                socketRef.current.emit('test', { message: 'Connection test' });
            });
            
            socketRef.current.on('connect_error', (error) => {
                console.error('❌ Socket.IO connection error:', error);
                console.error('Error details:', {
                    message: error.message,
                    description: error.description,
                    context: error.context,
                    type: error.type
                });
                setError(`Connection failed: ${error.message}`);
                setIsConnected(false);
                setConnectionAttempts(prev => prev + 1);
                
                // Retry connection after delay
                if (connectionAttempts < 3) {
                    setTimeout(() => {
                        console.log('🔄 Retrying connection...');
                        initializeSocketConnection();
                    }, 2000);
                }
            });
            
            socketRef.current.on('disconnect', (reason) => {
                console.log('🔌 Disconnected from interview server:', reason);
                setIsConnected(false);
            });
            
            socketRef.current.on('voice_result', (data) => {
                console.log('🎤 Received voice result:', data);
                if (data.transcript) {
                    console.log('📝 Updating transcript with:', data.transcript);
                    setTranscript(prev => {
                        const newTranscript = prev + ' ' + data.transcript;
                        console.log('📝 New transcript state:', newTranscript);
                        return newTranscript;
                    });
                    onTranscriptUpdate && onTranscriptUpdate(data.transcript);
                    
                    // Generate AI response when user speaks
                    if (data.transcript.trim().length > 10) {
                        console.log('🤖 Generating AI response for:', data.transcript);
                        generateAIResponse(data.transcript, currentQuestion);
                    }
                }
                if (data.audio_quality) {
                    setAudioQuality(data.audio_quality);
                    onAudioQualityUpdate && onAudioQualityUpdate(data.audio_quality);
                }
            });
            
            socketRef.current.on('error', (error) => {
                console.error('❌ Socket.IO error:', error);
                setError(error.message);
            });
            
            socketRef.current.on('test_response', (data) => {
                console.log('✅ Test response received:', data);
            });
            
        } catch (error) {
            console.error('Error initializing socket connection:', error);
            setError(`Socket initialization failed: ${error.message}`);
        }
    };

    useEffect(() => {
        // Initialize WebSocket connection
        initializeSocketConnection();
        
        return () => {
            console.log('🧹 Cleaning up Socket.IO connection');
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            // Cleanup blob URL
            if (mediaBlobUrl) {
                URL.revokeObjectURL(mediaBlobUrl);
            }
            // Cleanup audio test
            stopAudioTest();
        };
    }, [role, currentQuestion, questionIndex]);

    const handleStartRecording = async () => {
        try {
            setError(null);
            setIsRecording(true);
            setStatus('recording');
            audioChunksRef.current = [];
            
            // Clear previous blob URL
            if (mediaBlobUrl) {
                URL.revokeObjectURL(mediaBlobUrl);
                setMediaBlobUrl(null);
            }
            
            // Set up real-time audio processing
            const audioConstraints = selectedAudioDevice 
                ? { audio: { deviceId: selectedAudioDevice } }
                : { audio: true };
            const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    processAudioChunk(event.data);
                }
            };
            
            mediaRecorderRef.current.start(1000); // Process every second
            
        } catch (err) {
            setError('Failed to start recording: ' + err.message);
            setIsRecording(false);
            setStatus('idle');
        }
    };

    const handleStopRecording = () => {
        setIsRecording(false);
        setStatus('stopped');
        
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            
            // Create blob URL for the recorded audio
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(audioBlob);
            setMediaBlobUrl(url);
        }
    };

    const processAudioChunk = async (audioBlob) => {
        try {
            // Convert WebM to WAV format for better compatibility
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Convert to WAV format
            const wavBlob = await convertToWav(audioBuffer);
            const wavArrayBuffer = await wavBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(wavArrayBuffer)));
            
            // Send to server via WebSocket
            if (socketRef.current && isConnected) {
                socketRef.current.emit('voice', {
                    type: 'voice',
                    audio_data: base64Audio,
                    session_id: sessionId,
                    role: role,
                    timestamp: Date.now()
                });
            }
        } catch (err) {
            console.error('Error processing audio chunk:', err);
        }
    };

    const convertToWav = async (audioBuffer) => {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;
        
        // Create WAV header
        const buffer = new ArrayBuffer(44 + length * numChannels * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numChannels * 2, true);
        
        // Convert audio data
        const offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset + (i * numChannels + channel) * 2, sample * 0x7FFF, true);
            }
        }
        
        return new Blob([buffer], { type: 'audio/wav' });
    };

    const clearTranscript = () => {
        setTranscript('');
    };

    const downloadTranscript = () => {
        const element = document.createElement('a');
        const file = new Blob([transcript], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `interview_transcript_${sessionId}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const retryConnection = () => {
        setError(null);
        setConnectionAttempts(0);
        initializeSocketConnection();
    };

    return (
        <div className="voice-interview-container">
            <div className="voice-interview-header">
                <h3>Voice Interview</h3>
                <div className="connection-status">
                    <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '●' : '○'}
                    </span>
                    {isConnected ? 'Connected' : 'Disconnected'}
                    {!isConnected && connectionAttempts > 0 && (
                        <span className="retry-hint"> (Attempt {connectionAttempts}/3)</span>
                    )}
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    {!isConnected && (
                        <button onClick={retryConnection} className="retry-button">
                            🔄 Retry Connection
                        </button>
                    )}
                </div>
            )}

            <div className="recording-controls">
                <button
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={!isConnected}
                >
                    {isRecording ? (
                        <>
                            <span className="recording-indicator"></span>
                            Stop Recording
                        </>
                    ) : (
                        'Start Recording'
                    )}
                </button>
                
                {/* Audio Testing Section */}
                <div className="audio-test-section">
                    <h4>🎵 Audio Testing</h4>
                    <div className="test-controls">
                        {!isAudioTesting ? (
                            <button 
                                onClick={testAudioDevice}
                                className="test-btn start"
                                disabled={!selectedAudioDevice}
                            >
                                🎵 Test Audio Device
                            </button>
                        ) : (
                            <button 
                                onClick={stopAudioTest}
                                className="test-btn stop"
                            >
                                ⏹️ Stop Test
                            </button>
                        )}
                    </div>

                    {isAudioTesting && (
                        <div className="audio-visualizer">
                            <div className="audio-bar">
                                <div 
                                    className="audio-level"
                                    style={{ width: `${(audioLevel / 255) * 100}%` }}
                                ></div>
                            </div>
                            <span className="audio-label">
                                Audio Level: {Math.round((audioLevel / 255) * 100)}%
                            </span>
                        </div>
                    )}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                        className="demo-button"
                        onClick={handleManualResponse}
                        style={{
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '12px 24px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        🎭 Demo Mode - Simulate Response
                    </button>
                    <button
                        onClick={() => {
                            console.log('🧪 Test button clicked');
                            setTranscript(prev => {
                                const testText = 'This is a test transcript entry. ';
                                const newTranscript = prev + testText;
                                console.log('🧪 Added test text, new transcript:', newTranscript);
                                return newTranscript;
                            });
                        }}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '12px 24px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        🧪 Test Transcript
                    </button>
                    <button
                        onClick={() => {
                            console.log('🎯 Direct set test');
                            setTranscript('This is a direct test of the transcript display. It should show up immediately.');
                        }}
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '12px 24px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        🎯 Direct Set
                    </button>
                </div>
                
                <div className="recording-status">
                    Status: {status}
                    {!isConnected && (
                        <span style={{ color: '#f87171', marginLeft: '10px' }}>
                            (Offline Mode)
                        </span>
                    )}
                </div>
            </div>

            {audioQuality && (
                <div className="audio-quality-panel">
                    <h4>Audio Quality Metrics</h4>
                    <div className="quality-metrics">
                        <div className="metric">
                            <label>Volume:</label>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${Math.min((audioQuality.volume || 0) / 1000, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="metric">
                            <label>Clarity:</label>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${Math.min((audioQuality.clarity || 0) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="metric">
                            <label>SNR:</label>
                            <span>{(audioQuality.snr || 0).toFixed(1)} dB</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Question Display */}
            {currentQuestion && (
                <div className="question-panel">
                    <h4>🎯 Current Question</h4>
                    <div className="question-content">
                        <p className="question-text">{currentQuestion}</p>
                    </div>
                </div>
            )}

            {/* AI Response Display */}
            {aiResponse && (
                <div className="ai-response-panel">
                    <h4>🤖 AI Interviewer Response</h4>
                    <div className="ai-response-content">
                        {isProcessing ? (
                            <div className="processing-indicator">
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <p>AI is thinking...</p>
                            </div>
                        ) : (
                            <p className="ai-response-text">{aiResponse}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Debug Info */}
            <div style={{
                background: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                borderRadius: '10px',
                padding: '10px',
                marginBottom: '20px',
                fontSize: '0.8rem'
            }}>
                <strong>🔍 Debug Info:</strong><br/>
                Transcript length: {transcript ? transcript.length : 0}<br/>
                Transcript preview: {transcript ? transcript.substring(0, 100) + '...' : 'None'}<br/>
                Is connected: {isConnected ? 'Yes' : 'No'}<br/>
                Is recording: {isRecording ? 'Yes' : 'No'}
            </div>

            <div className="transcript-panel">
                <div className="transcript-header">
                    <h4>Live Transcript</h4>
                    <div className="transcript-controls">
                        <button onClick={clearTranscript} className="clear-button">
                            Clear
                        </button>
                        <button onClick={downloadTranscript} className="download-button">
                            Download
                        </button>
                    </div>
                </div>
                
                <div className="transcript-content">
                    {console.log('🔍 Rendering transcript panel, transcript:', transcript)}
                    {transcript ? (
                        <p>{transcript}</p>
                    ) : (
                        <p className="placeholder-text">
                            Start recording to see live transcription...
                        </p>
                    )}
                </div>
            </div>

            {mediaBlobUrl && (
                <div className="audio-playback">
                    <h4>Recorded Audio</h4>
                    <audio src={mediaBlobUrl} controls />
                </div>
            )}
        </div>
    );
};

export default VoiceInterview; 