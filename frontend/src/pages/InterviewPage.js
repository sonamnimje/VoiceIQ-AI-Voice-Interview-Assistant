import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaPlay, 
  FaPause, 
  FaStop,
  FaArrowLeft,
  FaClock,
  FaUserTie,
  FaBrain,
  FaCheck,
  FaTimes,
  FaVolumeUp,
  FaVolumeMute,
  FaCog,
  FaQuestionCircle,
  FaLightbulb,
  FaChartLine,
  FaGraduationCap,
  FaVideo,
  FaVideoSlash,
  FaCamera,
  FaCameraSlash,


} from 'react-icons/fa';
import config from '../config';
import { showToast } from '../components/Toast';
import ModernPopup from '../components/ModernPopup';
import './InterviewPage.css';

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, config: interviewConfig } = location.state || {};
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    console.log('InterviewPage useEffect triggered with:', { sessionId, interviewConfig });
    
    if (!sessionId || !interviewConfig) {
      console.error('Missing sessionId or interviewConfig:', { sessionId, interviewConfig });
      showToast('Invalid interview session. Please start a new interview.', 'error');
      navigate('/start-interview');
      return;
    }

    console.log('Initializing interview with valid session data');
    initializeInterview();
  }, [sessionId, interviewConfig]);

  useEffect(() => {
    let interval;
    if (interviewStarted && !isLoading) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interviewStarted, isLoading]);

  // Handle page leave warning with modern popup
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (interviewStarted && !isLoading) {
        // Show modern popup instead of browser alert
        setPopupConfig({
          title: 'Leave Interview?',
          message: 'Are you sure you want to leave the interview? Your progress will be lost.',
          type: 'warning',
          actions: [
            <button
              key="cancel"
              onClick={() => setShowPopup(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                minWidth: '100px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Cancel
            </button>,
            <button
              key="ok"
              onClick={() => {
                setShowPopup(false);
                window.removeEventListener('beforeunload', handleBeforeUnload);
                window.location.href = '/dashboard';
              }}
              style={{
                background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                minWidth: '100px',
                boxShadow: '0 4px 15px rgba(255, 107, 157, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 157, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 157, 0.3)';
              }}
            >
              OK
            </button>
          ]
        });
        setShowPopup(true);
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    if (interviewStarted) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [interviewStarted, isLoading]);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any remaining object URLs to prevent memory leaks
      capturedPhotos.forEach(photo => {
        if (photo.blob && photo.blob instanceof Blob) {
          try {
            const url = URL.createObjectURL(photo.blob);
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error('Error cleaning up photo URL:', error);
          }
        }
      });
    };
  }, [capturedPhotos]);

  // Handle navigation away from interview page
  useEffect(() => {
    const handlePopState = (e) => {
      if (interviewStarted && !isLoading) {
        e.preventDefault();
        setPopupConfig({
          title: 'Leave Interview?',
          message: 'Are you sure you want to leave the interview? Your progress will be lost.',
          type: 'warning',
          actions: [
            <button
              key="cancel"
              onClick={() => setShowPopup(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                minWidth: '100px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Cancel
            </button>,
            <button
              key="ok"
              onClick={() => {
                setShowPopup(false);
                navigate('/dashboard');
              }}
              style={{
                background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                minWidth: '100px',
                boxShadow: '0 4px 15px rgba(255, 107, 157, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 157, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 157, 0.3)';
              }}
            >
              OK
            </button>
          ]
        });
        setShowPopup(true);
        // Push the current state back to prevent navigation
        window.history.pushState(null, null, window.location.pathname);
      }
    };

    if (interviewStarted) {
      window.addEventListener('popstate', handlePopState);
      // Push initial state to enable popstate detection
      window.history.pushState(null, null, window.location.pathname);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [interviewStarted, isLoading, navigate]);

  const initializeInterview = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing interview with config:', interviewConfig);
      
      // Generate questions based on interview configuration
      const questionsResponse = await fetch(`${config.BACKEND_URL}/api/interview-modes/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: interviewConfig.type,
          role: interviewConfig.role,
          difficulty: interviewConfig.difficulty,
          count: Math.ceil(interviewConfig.duration / 5), // Rough estimate: 5 min per question
          sessionId: sessionId // Add sessionId to store questions in database
        })
      });

      console.log('Questions response status:', questionsResponse.status);
      
      if (!questionsResponse.ok) {
        throw new Error(`HTTP error! status: ${questionsResponse.status}`);
      }

      const questionsData = await questionsResponse.json();
      console.log('Questions data received:', questionsData);
      
      if (questionsData.success && questionsData.questions && questionsData.questions.length > 0) {
        console.log('Setting questions from API:', questionsData.questions);
        // Store questions with their IDs for proper database tracking
        setQuestions(questionsData.questions);
        setCurrentQuestion(questionsData.questions[0]);
      } else {
        console.log('API returned no questions, using fallback questions');
        const fallbackQuestions = getFallbackQuestions();
        console.log('Fallback questions:', fallbackQuestions);
        setQuestions(fallbackQuestions);
        setCurrentQuestion(fallbackQuestions[0]);
      }

      setInterviewStarted(true);
    } catch (error) {
      console.error('Error initializing interview:', error);
      console.log('Using fallback questions due to error');
      setConnectionError(true);
      const fallbackQuestions = getFallbackQuestions();
      console.log('Fallback questions:', fallbackQuestions);
      setQuestions(fallbackQuestions);
      setCurrentQuestion(fallbackQuestions[0]);
      setInterviewStarted(true);
      showToast('Using fallback questions due to connection issue.', 'warning');
    } finally {
      setIsLoading(false);
      // Show camera permission request after interview is loaded
      setTimeout(() => {
        setPopupConfig({
          title: 'Camera Access',
          message: 'This interview supports video recording. Would you like to enable camera access for a more complete interview experience?\n\nBenefits:\n• Record your interview responses\n• Capture photos during the session\n• Review your body language and presentation\n• Save memorable moments from your interview',
          type: 'info',
          actions: [
            <button
              key="skip"
              onClick={() => {
                setShowPopup(false);
                showToast('Camera access skipped. You can enable it later.', 'info');
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                minWidth: '100px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Skip
            </button>,
            <button
              key="enable"
              onClick={async () => {
                setShowPopup(false);
                await startCamera();
              }}
              style={{
                background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                minWidth: '100px',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
              }}
            >
              Enable Camera
            </button>
          ]
        });
        setShowPopup(true);
      }, 1000);
    }
  };

  const getFallbackQuestions = () => {
    const fallbackQuestions = {
      technical: {
        beginner: [
          "What is the difference between a variable and a constant?",
          "Explain what a function is and why we use it.",
          "What is the difference between HTML and CSS?",
          "Describe what a database is and why it's important.",
          "What is version control and why do developers use it?"
        ],
        intermediate: [
          "Explain the difference between a stack and a queue.",
          "What is the time complexity of binary search?",
          "Describe how you would implement a hash table.",
          "What is the difference between REST and GraphQL?",
          "Explain the concept of dependency injection."
        ],
        advanced: [
          "Design a distributed caching system for a high-traffic website.",
          "Explain how you would implement a load balancer.",
          "Describe the CAP theorem and its implications for distributed systems.",
          "How would you design a real-time messaging system?",
          "Explain microservices architecture and its trade-offs."
        ],
        expert: [
          "Design a system that can handle 1 million concurrent users.",
          "Explain how you would implement a distributed consensus algorithm.",
          "Design a fault-tolerant database system.",
          "How would you architect a system for real-time data processing?",
          "Explain how to implement a distributed lock mechanism."
        ]
      },
      behavioral: {
        beginner: [
          "Tell me about yourself and your background.",
          "What are your strengths and weaknesses?",
          "Why are you interested in this role?",
          "Describe a time when you worked in a team.",
          "What do you do when you don't know how to solve a problem?"
        ],
        intermediate: [
          "Tell me about a time when you had to work with a difficult team member.",
          "Describe a situation where you had to learn a new technology quickly.",
          "Give me an example of when you had to make a difficult decision.",
          "Tell me about a project that didn't go as planned.",
          "Describe a time when you had to lead a team."
        ],
        advanced: [
          "Describe a time when you had to influence stakeholders without authority.",
          "Tell me about a complex project you managed with multiple dependencies.",
          "How do you handle conflicting priorities from different stakeholders?",
          "Describe a time when you had to make a decision with incomplete information.",
          "Tell me about a time when you had to drive organizational change."
        ],
        expert: [
          "Describe how you would restructure an underperforming team.",
          "Tell me about a time when you had to make a strategic decision that affected the entire company.",
          "How do you approach building and maintaining relationships with C-level executives?",
          "Describe a time when you had to manage a crisis situation.",
          "How do you balance innovation with operational stability?"
        ]
      },
      mixed: {
        beginner: [
          "What is a variable and how do you use it?",
          "Tell me about yourself and your background.",
          "What is the difference between HTML and CSS?",
          "Describe a time when you worked in a team.",
          "What is a database and why is it important?"
        ],
        intermediate: [
          "Explain the difference between a stack and a queue.",
          "Tell me about a time when you had to work with a difficult team member.",
          "What is the time complexity of binary search?",
          "Describe a situation where you had to learn a new technology quickly.",
          "What is the difference between REST and GraphQL?"
        ],
        advanced: [
          "Design a simple caching system for a web application.",
          "Describe a time when you had to influence stakeholders without authority.",
          "Explain how you would implement a basic load balancer.",
          "Tell me about a complex project you managed.",
          "How would you design a simple real-time messaging system?"
        ],
        expert: [
          "Design a system that can handle high concurrent users.",
          "Describe how you would restructure an underperforming team.",
          "Explain how you would implement a distributed consensus algorithm.",
          "Tell me about a strategic decision that affected the entire company.",
          "How would you architect a system for real-time data processing?"
        ]
      },
      practice: {
        beginner: [
          "What are your strengths and weaknesses?",
          "Why do you want to work for this company?",
          "Where do you see yourself in 5 years?",
          "Tell me about yourself.",
          "What are your salary expectations?"
        ],
        intermediate: [
          "What are your strengths and weaknesses?",
          "Why do you want to work for this company?",
          "Where do you see yourself in 5 years?",
          "Tell me about yourself.",
          "What are your salary expectations?"
        ],
        advanced: [
          "What are your strengths and weaknesses?",
          "Why do you want to work for this company?",
          "Where do you see yourself in 5 years?",
          "Tell me about yourself.",
          "What are your salary expectations?"
        ],
        expert: [
          "What are your strengths and weaknesses?",
          "Why do you want to work for this company?",
          "Where do you see yourself in 5 years?",
          "Tell me about yourself.",
          "What are your salary expectations?"
        ]
      }
    };

    // Get the appropriate question set based on interview type and difficulty
    const questionSet = fallbackQuestions[interviewConfig.type]?.[interviewConfig.difficulty] || 
                       fallbackQuestions[interviewConfig.type]?.['intermediate'] || 
                       fallbackQuestions.mixed.intermediate;
    
    // Ensure we always return an array with at least one question
    if (!Array.isArray(questionSet) || questionSet.length === 0) {
      console.warn('No fallback questions found for type:', interviewConfig.type, 'using mixed questions');
      return fallbackQuestions.mixed;
    }
    
    console.log('Selected fallback questions for type:', interviewConfig.type, ':', questionSet);
    return questionSet;
  };

  const retryConnection = async () => {
    setConnectionError(false);
    setIsLoading(true);
    try {
      await initializeInterview();
    } catch (error) {
      console.error('Retry failed:', error);
      setConnectionError(true);
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioChunks(chunks);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      showToast('Recording started', 'success');
    } catch (error) {
      console.error('Error starting recording:', error);
      showToast('Failed to start recording. Please check microphone permissions.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      showToast('Recording stopped', 'info');
    }
  };



  const playRecording = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraLoading(true);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      // Validate the stream
      if (!stream || !stream.active) {
        throw new Error('Failed to get camera stream');
      }
      
      setCameraStream(stream);
      setIsCameraOn(true);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera video stream ready');
          setIsCameraLoading(false);
        };
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          setCameraError('Failed to load video stream');
          setIsCameraLoading(false);
        };
      }
      
      showToast('Camera access granted', 'success');
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(error.message);
      setIsCameraOn(false);
      setShowCamera(false);
      setIsCameraLoading(false);
      
      if (error.name === 'NotAllowedError') {
        showToast('Camera access denied. Please allow camera permissions.', 'error');
      } else if (error.name === 'NotFoundError') {
        showToast('No camera found on your device.', 'error');
      } else if (error.name === 'NotSupportedError') {
        showToast('Camera is not supported in this browser.', 'error');
      } else {
        showToast(`Failed to access camera: ${error.message}`, 'error');
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraOn(false);
      setShowCamera(false);
      setIsCameraLoading(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      showToast('Camera turned off', 'info');
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && isCameraOn) {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        
        // Draw the current video frame to canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            showToast('Failed to capture photo. Please try again.', 'error');
            return;
          }
          
          const photoData = {
            id: Date.now(),
            blob: blob,
            timestamp: new Date().toISOString(),
            questionIndex: questionIndex,
            question: currentQuestion ? (typeof currentQuestion === 'object' ? currentQuestion.question : currentQuestion) : 'Unknown question'
          };
          
          // Save to session state
          setCapturedPhotos(prev => [...prev, photoData]);
          
          // Download the photo
          try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `interview-photo-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
            
            showToast('Photo captured and saved to session!', 'success');
          } catch (downloadError) {
            console.error('Error downloading photo:', downloadError);
            showToast('Photo captured but download failed.', 'warning');
          }
        }, 'image/png', 0.9);
      } catch (error) {
        console.error('Error capturing photo:', error);
        showToast('Failed to capture photo. Please try again.', 'error');
      }
    } else {
      showToast('Camera is not available. Please turn on camera first.', 'error');
    }
  };

  const submitResponse = async () => {
    if (!currentResponse.trim() && !audioBlob) {
      showToast('Please provide a response before submitting.', 'error');
      return;
    }

    // Show confirmation for final question
    if (questionIndex === questions.length - 1) {
      setPopupConfig({
        title: 'Final Question',
        message: 'This is your final question. Are you sure you want to submit and complete the interview?',
        type: 'warning',
        actions: [
          <button
            key="cancel"
            onClick={() => setShowPopup(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              minWidth: '100px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Cancel
          </button>,
          <button
            key="submit"
            onClick={() => {
              setShowPopup(false);
              processSubmission();
            }}
            style={{
              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              minWidth: '100px',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
            }}
          >
            Submit Interview
          </button>
        ]
      });
      setShowPopup(true);
      return;
    }

    await processSubmission();
  };

  const processSubmission = async () => {
    try {
      setIsLoading(true);

      const currentQuestionData = questions[questionIndex];
      const questionId = currentQuestionData?.id; // Get question ID from stored question data
      const questionText = currentQuestionData ? (typeof currentQuestionData === 'object' ? currentQuestionData.question : currentQuestionData) : 'Unknown question';

      const responseData = {
        sessionId,
        questionIndex,
        questionId, // Add question ID for proper database association
        question: questionText,
        answer: currentResponse,
        audioBlob: audioBlob,
        timestamp: Date.now()
      };

      // Save response to backend (only if backend is available)
      if (!connectionError) {
        try {
          const response = await fetch(`${config.BACKEND_URL}/api/interview/response`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(responseData)
          });

          const data = await response.json();

          if (data.success) {
            setResponses(prev => [...prev, responseData]);
            
            // Get AI feedback for this response
            const feedbackResponse = await fetch(`${config.BACKEND_URL}/api/llm/analyze-response`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: questionText,
                answer: currentResponse,
                role: interviewConfig.role,
                context: {
                  mode: interviewConfig.type,
                  difficulty: interviewConfig.difficulty,
                  questionIndex: questionIndex + 1,
                  totalQuestions: questions.length,
                  interviewDuration: interviewConfig.duration
                },
                evaluationCriteria: {
                  technical: interviewConfig.type === 'technical' || interviewConfig.type === 'mixed',
                  behavioral: interviewConfig.type === 'behavioral' || interviewConfig.type === 'mixed',
                  difficultyLevel: interviewConfig.difficulty,
                  roleSpecific: interviewConfig.role
                }
              })
            });

            const feedbackData = await feedbackResponse.json();
            
            if (feedbackData.success) {
              setFeedback(feedbackData.feedback);
              setShowFeedback(true);
            }
          }
        } catch (backendError) {
          console.error('Backend error during submission:', backendError);
          setConnectionError(true);
          showToast('Backend connection lost. Saving response locally.', 'warning');
        }
      } else {
        // Offline mode - just save locally
        setResponses(prev => [...prev, responseData]);
        showToast('Response saved locally (offline mode).', 'info');
      }

      // Move to next question or end interview
      if (questionIndex < questions.length - 1) {
        setQuestionIndex(prev => prev + 1);
        setCurrentQuestion(questions[questionIndex + 1]);
        setCurrentResponse('');
        setAudioBlob(null);
        setAudioChunks([]);
        setShowFeedback(false);
        setFeedback(null);
      } else {
        // End interview
        if (!connectionError) {
          await endInterview();
        } else {
          showToast('Interview completed in offline mode!', 'success');
          navigate('/feedback', { 
            state: { 
              sessionId,
              responses,
              config: interviewConfig
            } 
          });
        }
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      showToast('Failed to submit response. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async () => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/interview/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();
      
      if (data.success) {
        showToast('Interview completed successfully!', 'success');
        navigate('/feedback', { 
          state: { 
            sessionId,
            responses,
            config: interviewConfig
          } 
        });
      }
    } catch (error) {
      console.error('Error ending interview:', error);
      showToast('Failed to end interview properly.', 'error');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInterviewTypeIcon = () => {
    switch (interviewConfig.type) {
      case 'technical': return <FaBrain />;
      case 'behavioral': return <FaUserTie />;
      case 'mixed': return <FaLightbulb />;
      case 'practice': return <FaQuestionCircle />;
      default: return <FaQuestionCircle />;
    }
  };

  const getDifficultyGuidance = () => {
    const guidance = {
      beginner: {
        title: "Beginner-Friendly Interview",
        description: "This is a supportive environment. Take your time, ask for clarification if needed, and don't worry about making mistakes.",
        tips: [
          "Focus on demonstrating your basic understanding",
          "It's okay to ask for clarification",
          "Share your learning journey and growth mindset",
          "Be honest about what you know and don't know"
        ]
      },
      intermediate: {
        title: "Standard Interview",
        description: "This interview will test your practical knowledge and experience. Show your problem-solving approach.",
        tips: [
          "Demonstrate your practical experience",
          "Explain your reasoning and approach",
          "Provide specific examples from your work",
          "Show how you handle challenges"
        ]
      },
      advanced: {
        title: "Advanced Interview",
        description: "This interview will challenge you with complex scenarios. Think strategically and demonstrate deep expertise.",
        tips: [
          "Show strategic thinking and system design skills",
          "Demonstrate deep technical or leadership expertise",
          "Consider scalability and trade-offs",
          "Show how you approach complex problems"
        ]
      },
      expert: {
        title: "Expert-Level Interview",
        description: "This interview will test your ability to handle enterprise-level challenges and strategic decision-making.",
        tips: [
          "Demonstrate enterprise-level thinking",
          "Show strategic vision and leadership",
          "Consider business impact and ROI",
          "Display deep domain expertise"
        ]
      }
    };
    
    return guidance[interviewConfig.difficulty] || guidance.intermediate;
  };

  if (isLoading && !interviewStarted) {
    return (
      <div className="interview-loading">
        <div className="loading-spinner"></div>
        <p>Initializing your interview...</p>
        <p className="loading-details">Setting up questions and preparing your session</p>
        {/* Connection retry button removed */}
      </div>
    );
  }

  if (!currentQuestion) {
    console.log('No current question available. Questions array:', questions);
    return (
      <div className="interview-loading">
        <div className="loading-spinner"></div>
        <p>Loading question...</p>
        <p className="loading-details">Preparing your first question</p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    console.log('No questions available. Questions array:', questions);
    return (
      <div className="interview-loading">
        <div className="loading-spinner"></div>
        <p>Loading questions...</p>
        <p className="loading-details">Generating interview questions</p>
      </div>
    );
  }

  return (
    <div className="interview-page">
      <div className="interview-header">
        <div className="header-top">
          <button 
            className="back-button"
            onClick={() => {
              setPopupConfig({
                title: 'Leave Interview?',
                message: 'Are you sure you want to leave the interview? Your progress will be lost.',
                type: 'warning',
                actions: [
                  <button
                    key="cancel"
                    onClick={() => setShowPopup(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      minWidth: '100px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Cancel
                  </button>,
                  <button
                    key="ok"
                    onClick={() => {
                      setShowPopup(false);
                      navigate('/start-interview');
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
                      border: 'none',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      minWidth: '100px',
                      boxShadow: '0 4px 15px rgba(255, 107, 157, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 157, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 157, 0.3)';
                    }}
                  >
                    OK
                  </button>
                ]
              });
              setShowPopup(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              minHeight: '44px',
              minWidth: '140px',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <FaArrowLeft />
            Back to Start
          </button>
        </div>
        
        <div className="interview-info">
          <div className="interview-type">
            {getInterviewTypeIcon()}
            <span>{interviewConfig.type.charAt(0).toUpperCase() + interviewConfig.type.slice(1)} Interview</span>
          </div>
          <div className="interview-timer">
            <FaClock />
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {/* Connection warning removed - offline mode warning disabled */}

        <div className="interview-progress">
          <span>Question {questionIndex + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${questions.length > 0 ? ((questionIndex + 1) / questions.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="interview-content">
        {/* Main two-column layout for questions and responses */}
        <div className="main-content-grid">
          <div className="question-section">
            <h2>Current Question</h2>
            {questionIndex === questions.length - 1 && (
              <div className="last-question-indicator">
                <span>🎯 Final Question</span>
              </div>
            )}
            <div className="question-card">
              <p>{currentQuestion ? (typeof currentQuestion === 'object' ? currentQuestion.question : currentQuestion) : 'Loading question...'}</p>
            </div>
          </div>

          <div className="response-section">
            <h3>Your Response</h3>
            
            <div className="response-input">
              <textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Type your response here..."
                rows={6}
                disabled={isRecording}
              />
            </div>

            <div className="audio-controls">
              <div className="control-group">
                <button 
                  className={`control-btn ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                >
                  {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>

                {audioBlob && (
                  <button 
                    className="control-btn"
                    onClick={playRecording}
                    disabled={isPlaying}
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                    {isPlaying ? 'Playing...' : 'Play Recording'}
                  </button>
                )}
              </div>
            </div>

            <div className="response-actions">
              <button 
                className="submit-btn"
                onClick={submitResponse}
                disabled={isLoading || !currentQuestion || (!currentResponse.trim() && !audioBlob)}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    {questionIndex === questions.length - 1 ? 'Submit Interview' : 'Submit Response'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Camera section moved to bottom */}
        <div className="camera-section">
          <div className="camera-header">
            <div className="camera-title-section">
              <h3>Camera Feed</h3>
              <div className="camera-status" style={{
                fontSize: '0.8rem',
                color: isCameraOn ? '#38a169' : '#718096',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '5px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isCameraOn ? '#38a169' : '#718096',
                  display: 'inline-block'
                }}></span>
                {isCameraLoading ? 'Starting...' : isCameraOn ? 'Live' : 'Offline'}
              </div>
            </div>
            <div className="camera-controls">
              <button 
                className={`camera-btn ${isCameraOn ? 'active' : ''}`}
                onClick={toggleCamera}
                disabled={isLoading || isCameraLoading}
              >
                {isCameraLoading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                    Starting Camera...
                  </>
                ) : isCameraOn ? (
                  <>
                    <FaVideoSlash />
                    Turn Off Camera
                  </>
                ) : (
                  <>
                    <FaVideo />
                    Turn On Camera
                  </>
                )}
              </button>
              

            </div>
          </div>

          {cameraError && (
            <div className="camera-error">
              <p>⚠️ {cameraError}</p>
              <button 
                className="retry-camera-btn"
                onClick={startCamera}
              >
                Retry Camera Access
              </button>
            </div>
          )}

          {showCamera && isCameraOn && (
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  background: '#000'
                }}
              />
              {isCameraLoading && (
                <div className="video-loading-overlay" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px'
                }}>
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                    <p>Starting camera...</p>
                  </div>
                </div>
              )}
              <div className="video-overlay">
                <span className="recording-indicator">● LIVE</span>
              </div>
            </div>
          )}

          {!showCamera && !cameraError && (
            <div className="camera-placeholder">
              <div className="placeholder-content">
                <FaVideo style={{ fontSize: '48px', opacity: 0.5, marginBottom: '15px' }} />
                <p>Camera is turned off</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                  Click "Turn On Camera" to start video feed
                </p>
              </div>
            </div>
          )}

          {capturedPhotos.length > 0 && (
            <div className="photo-gallery">
              <h4 style={{ 
                color: '#2d3748', 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                margin: '20px 0 15px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FaCamera />
                Captured Photos ({capturedPhotos.length})
              </h4>
              <div className="photo-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '12px',
                marginTop: '10px'
              }}>
                {capturedPhotos.map((photo, index) => {
                  // Validate that the photo has a valid blob
                  if (!photo.blob || !(photo.blob instanceof Blob)) {
                    return null;
                  }
                  
                  try {
                    const photoUrl = URL.createObjectURL(photo.blob);
                    return (
                      <div key={photo.id} className="photo-item" style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        background: '#f7fafc'
                      }}>
                        <img 
                          src={photoUrl} 
                          alt={`Interview photo ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '90px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onLoad={() => {
                            // Clean up the URL after the image loads
                            setTimeout(() => URL.revokeObjectURL(photoUrl), 1000);
                          }}
                          onError={() => {
                            // Clean up the URL if image fails to load
                            URL.revokeObjectURL(photoUrl);
                          }}
                        />
                        <div className="photo-info" style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          textAlign: 'center'
                        }}>
                          Q{photo.questionIndex + 1}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error creating object URL for photo:', error);
                    return null;
                  }
                })}
              </div>
            </div>
          )}
        </div>

        {showFeedback && feedback && (
          <div className="feedback-section">
            <h3>AI Feedback</h3>
            <div className="feedback-card">
              <div className="feedback-score">
                <span>Score: {feedback.score}/10</span>
              </div>
              <div className="feedback-content">
                <h4>Strengths:</h4>
                <ul>
                  {feedback.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
                <h4>Areas for Improvement:</h4>
                <ul>
                  {feedback.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
                <h4>Suggestions:</h4>
                <p>{feedback.suggestions}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Popup */}
      <ModernPopup
        open={showPopup}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
        actions={popupConfig.actions}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
};

export default InterviewPage; 