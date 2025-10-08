import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMicrophone, 
  FaPlay, 
  FaCog, 
  FaClock, 
  FaUserTie, 
  FaBrain, 
  FaBullseye,
  FaArrowRight,
  FaArrowLeft,
  FaArrowDown,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaRocket,
  FaGraduationCap,
  FaBriefcase,
  FaStar,
  FaShieldAlt,
  FaLightbulb,
  FaChartLine,
  FaUpload,
  FaFileAlt,
  FaTrash,
  FaSpinner,
  FaEye,
  FaMagic
} from 'react-icons/fa';
import config from '../config';
import { showToast } from '../components/Toast';
import './StartInterviewPage.css';

const StartInterviewPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1: Resume Upload, 2: AI Suggestions, 3: Configuration
  const [selectedInterviewType, setSelectedInterviewType] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [suggestedInterviewTypes, setSuggestedInterviewTypes] = useState([]);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [showInterviewInterface, setShowInterviewInterface] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [videoStream, setVideoStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [interviewSession, setInterviewSession] = useState(null);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  const handlePauseResume = () => {
    if (isPaused) {
      // Resume interview
      if (speechSynthesis) {
        speechSynthesis.resume();
      }
      showToast('Interview resumed', 'info');
    } else {
      // Pause interview
      if (speechSynthesis) {
        speechSynthesis.pause();
      }
      showToast('Interview paused', 'info');
    }
    setIsPaused(!isPaused);
  };

  const handleEndInterview = () => {
    // Stop any ongoing speech
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    
    // Stop media streams
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    // Reset interview state
    setIsRecording(false);
    setIsListening(false);
    setShowInterviewInterface(false);
    setShowConfirmation(false);
    setCurrentStep(1);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedSeconds(0);
    
    showToast('Interview ended successfully', 'success');
    // Navigate to feedback page with minimal context if available
    if (interviewSession) {
      navigate('/feedback', {
        state: {
          sessionId: interviewSession.sessionId,
          responses: questionHistory.map((q, idx) => ({
            questionIndex: idx,
            question: q.question || '',
            answer: q.userAnswer || ''
          })),
          config: interviewSession.config
        }
      });
    } else {
      navigate('/feedback');
    }
  };

  const handleFetchResponse = async () => {
    if (!currentQuestion) {
      showToast('No question to get response for', 'error');
      return;
    }

    setIsFetchingResponse(true);
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/interview/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          answer: currentQuestion,  // The current question as the answer to get a response
          answerCount: questionHistory.length,
          role: selectedRole || 'Software Engineer'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      // Update the question history with the AI's response
      setQuestionHistory(prev => [
        ...prev,
        { 
          question: currentQuestion, 
          answer: data.nextQuestion,  // The next question is the AI's response
          isAI: true,
          timestamp: new Date().toISOString(),
          score: data.score,
          feedback: data.feedback
        }
      ]);
      
      // Set the next question as current
      if (data.nextQuestion && !data.nextQuestion.includes('Thank you')) {
        setCurrentQuestion(data.nextQuestion);
      }
      
      // Speak the response if speech synthesis is available
      if (speechSynthesis && data.nextQuestion) {
        const utterance = new SpeechSynthesisUtterance(data.nextQuestion);
        setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
      }
      
      if (data.feedback) {
        showToast(`Response received: ${data.feedback}`, 'success');
      } else {
        showToast('Response generated successfully', 'success');
      }
    } catch (error) {
      console.error('Error fetching response:', error);
      showToast(error.message || 'Failed to fetch response', 'error');
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const allInterviewTypes = [
    {
      id: 'technical',
      title: 'Technical Interview',
      description: 'Coding challenges, system design, and technical problem-solving',
      icon: <FaBrain />,
      color: '#3b82f6',
      features: ['Live coding', 'System design', 'Algorithm challenges', 'Technical Q&A'],
      estimatedTime: '45-60 min',
      difficulty: 'Advanced',
      suitability: {
        technical_skills: 0.8,
        experience_level: 0.7,
        role_match: 0.9
      }
    },
    {
      id: 'behavioral',
      title: 'Behavioral Interview',
      description: 'STAR method questions, leadership, and soft skills assessment',
      icon: <FaUserTie />,
      color: '#10b981',
      features: ['STAR method', 'Leadership scenarios', 'Team collaboration', 'Problem-solving stories'],
      estimatedTime: '30-45 min',
      difficulty: 'Intermediate',
      suitability: {
        soft_skills: 0.9,
        experience_level: 0.6,
        role_match: 0.7
      }
    },
    {
      id: 'mixed',
      title: 'Mixed Interview',
      description: 'Combination of technical and behavioral questions',
      icon: <FaBullseye />,
      color: '#8b5cf6',
      features: ['Technical + Behavioral', 'Comprehensive assessment', 'Real-world scenarios', 'Holistic evaluation'],
      estimatedTime: '60-90 min',
      difficulty: 'Advanced',
      suitability: {
        technical_skills: 0.7,
        soft_skills: 0.7,
        experience_level: 0.8,
        role_match: 0.8
      }
    },
    {
      id: 'practice',
      title: 'Practice Mode',
      description: 'Low-pressure practice with instant feedback',
      icon: <FaGraduationCap />,
      color: '#f59e0b',
      features: ['Instant feedback', 'No pressure', 'Skill building', 'Confidence building'],
      estimatedTime: '20-30 min',
      difficulty: 'Beginner',
      suitability: {
        experience_level: 0.4,
        skill_gaps: 0.9,
        confidence_building: 0.9
      }
    }
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Basic questions, friendly environment' },
    { value: 'intermediate', label: 'Intermediate', description: 'Standard interview questions' },
    { value: 'advanced', label: 'Advanced', description: 'Challenging questions, senior level' },
    { value: 'expert', label: 'Expert', description: 'Senior/leadership level questions' }
  ];

  const durationOptions = [
    { value: 15, label: '15 minutes', description: 'Quick practice session' },
    { value: 30, label: '30 minutes', description: 'Standard interview length' },
    { value: 45, label: '45 minutes', description: 'Comprehensive interview' },
    { value: 60, label: '60 minutes', description: 'Full-length interview' }
  ];

  const roleOptions = [
    { value: 'software-engineer', label: 'Software Engineer' },
    { value: 'frontend-developer', label: 'Frontend Developer' },
    { value: 'backend-developer', label: 'Backend Developer' },
    { value: 'full-stack-developer', label: 'Full Stack Developer' },
    { value: 'data-scientist', label: 'Data Scientist' },
    { value: 'machine-learning-engineer', label: 'Machine Learning Engineer' },
    { value: 'devops-engineer', label: 'DevOps Engineer' },
    { value: 'product-manager', label: 'Product Manager' },
    { value: 'project-manager', label: 'Project Manager' },
    { value: 'ui-ux-designer', label: 'UI/UX Designer' },
    { value: 'graphic-designer', label: 'Graphic Designer' },
    { value: 'data-analyst', label: 'Data Analyst' },
    { value: 'business-analyst', label: 'Business Analyst' },
    { value: 'qa-engineer', label: 'QA Engineer' },
    { value: 'system-administrator', label: 'System Administrator' },
    { value: 'network-engineer', label: 'Network Engineer' },
    { value: 'cybersecurity-analyst', label: 'Cybersecurity Analyst' },
    { value: 'cloud-engineer', label: 'Cloud Engineer' },
    { value: 'mobile-developer', label: 'Mobile Developer' },
    { value: 'game-developer', label: 'Game Developer' },
    { value: 'blockchain-developer', label: 'Blockchain Developer' },
    { value: 'sales-representative', label: 'Sales Representative' },
    { value: 'marketing-specialist', label: 'Marketing Specialist' },
    { value: 'human-resources', label: 'Human Resources' },
    { value: 'customer-support', label: 'Customer Support' },
    { value: 'content-writer', label: 'Content Writer' },
    { value: 'digital-marketing', label: 'Digital Marketing' },
    { value: 'financial-analyst', label: 'Financial Analyst' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'legal-assistant', label: 'Legal Assistant' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadUserProfile();
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const email = localStorage.getItem('user_email');
      if (!email) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${config.BACKEND_URL}/api/profile?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Timer management: start when interview interface is visible and not paused
  useEffect(() => {
    if (showInterviewInterface && !isPaused) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setElapsedSeconds(prev => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [showInterviewInterface, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const formatElapsedTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  // Auto-submit (end) when time is up
  useEffect(() => {
    if (!showInterviewInterface) return;
    const totalSeconds = Number(selectedDuration) * 60;
    if (elapsedSeconds >= totalSeconds && totalSeconds > 0) {
      showToast('Time is up! Interview submitted automatically.', 'info');
      handleEndInterview();
    }
  }, [elapsedSeconds, selectedDuration, showInterviewInterface]);

  const analyzeResume = async () => {
    if (!resumeFile) {
      showToast('Please upload a resume first', 'error');
      return;
    }

    if (!selectedRole.trim()) {
      showToast('Please select a target role before analyzing the resume', 'error');
      return;
    }

    setIsAnalyzingResume(true);
    try {
      const formData = new FormData();
      formData.append('file', resumeFile);
      formData.append('role', selectedRole || 'Software Engineer');
      formData.append('user_email', localStorage.getItem('user_email'));

      const response = await fetch(`${config.BACKEND_URL}/api/resume/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResumeAnalysis(data.analysis);
        
        // Generate AI suggestions based on resume analysis
        const suggestions = generateInterviewSuggestions(data.analysis.extracted_info, data.analysis.skill_match);
        setSuggestedInterviewTypes(suggestions);
        
        setCurrentStep(2);
        showToast('Resume analyzed successfully! Here are your personalized interview suggestions.', 'success');
      } else {
        console.error('Resume analysis failed:', data.error);
        showToast(data.error || 'Failed to analyze resume', 'error');
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      if (error.name === 'TypeError' && error.message.includes('JSON')) {
        showToast('Invalid response from server. Please try again.', 'error');
      } else {
        showToast('Failed to analyze resume. Please try again.', 'error');
      }
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const generateInterviewSuggestions = (extractedInfo, skillMatch) => {
    if (!extractedInfo || !skillMatch) {
      return allInterviewTypes.slice(0, 3); // Default suggestions
    }

    const suggestions = [];
    const skills = extractedInfo.skills || {};
    const experience = extractedInfo.experience || [];
    
    // Calculate skill scores
    const technicalSkills = Object.values(skills).flat().length;
    const experienceLevel = experience.length;
    const overallMatch = skillMatch.overall_match_percentage || 50;

    // Score each interview type based on resume analysis
    allInterviewTypes.forEach(type => {
      let score = 0;
      
      switch (type.id) {
        case 'technical':
          if (technicalSkills > 5) score += 0.4;
          if (overallMatch > 70) score += 0.3;
          if (experienceLevel > 2) score += 0.3;
          break;
        case 'behavioral':
          if (experienceLevel > 1) score += 0.5;
          if (overallMatch > 60) score += 0.3;
          score += 0.2; // Always good for behavioral
          break;
        case 'mixed':
          if (technicalSkills > 3 && experienceLevel > 1) score += 0.6;
          if (overallMatch > 65) score += 0.4;
          break;
        case 'practice':
          if (technicalSkills < 3 || experienceLevel < 2) score += 0.7;
          if (overallMatch < 60) score += 0.3;
          break;
      }
      
      suggestions.push({
        ...type,
        aiScore: score,
        reasoning: generateReasoning(type, extractedInfo, skillMatch)
      });
    });

    // Sort by score and return top 3
    return suggestions
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 3);
  };

  const generateReasoning = (interviewType, extractedInfo, skillMatch) => {
    const skills = extractedInfo.skills || {};
    const experience = extractedInfo.experience || [];
    const technicalSkills = Object.values(skills).flat().length;
    const experienceLevel = experience.length;
    const overallMatch = skillMatch.overall_match_percentage || 50;

    switch (interviewType.id) {
      case 'technical':
        if (technicalSkills > 5) {
          return `Perfect for your strong technical background with ${technicalSkills} technical skills identified.`;
        } else {
          return `Great opportunity to showcase your technical abilities and improve your coding skills.`;
        }
      case 'behavioral':
        if (experienceLevel > 1) {
          return `Ideal for highlighting your ${experienceLevel} years of professional experience and leadership stories.`;
        } else {
          return `Excellent for developing your communication skills and preparing for behavioral questions.`;
        }
      case 'mixed':
        return `Comprehensive assessment combining your technical skills (${technicalSkills} identified) with behavioral experience.`;
      case 'practice':
        if (overallMatch < 60) {
          return `Perfect starting point to build confidence and identify areas for improvement.`;
        } else {
          return `Great for refining your interview skills and getting comfortable with the process.`;
        }
      default:
        return `Recommended based on your resume analysis and skill profile.`;
    }
  };

  const handleInterviewTypeSelect = (type) => {
    setSelectedInterviewType(type);
    setCurrentStep(3);
  };

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  const handleStartInterview = async () => {
    if (!selectedInterviewType) {
      showToast('Please select an interview type', 'error');
      return;
    }

    if (!selectedRole.trim()) {
      showToast('Please enter a target role', 'error');
      return;
    }

    // Show confirmation step first
    setShowConfirmation(true);
  };

  const confirmAndStartInterview = async () => {
    setIsLoading(true);
    try {
      const interviewConfig = {
        type: selectedInterviewType.id,
        role: selectedRole,
        difficulty: selectedDifficulty,
        duration: selectedDuration,
        userEmail: localStorage.getItem('user_email')
      };

      // If resume file is uploaded, create FormData to send file
      let response;
      if (resumeFile) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('config', JSON.stringify(interviewConfig));

        response = await fetch(`${config.BACKEND_URL}/api/interview/create-session-with-resume`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Create interview session without resume
        response = await fetch(`${config.BACKEND_URL}/api/interview/create-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(interviewConfig)
        });
      }

      const data = await response.json();
      
      if (data.success) {
        showToast('Interview session created successfully!', 'success');
        // Show the interview interface instead of navigating
        setShowInterviewInterface(true);
        setElapsedSeconds(0);
        setShowConfirmation(false);
        // Initialize camera and audio
        initializeMediaStreams();
        // Start the interview
        startInterviewSession(data.sessionId, interviewConfig);
      } else {
        showToast(data.message || 'Failed to create interview session', 'error');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      showToast('Failed to start interview. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMediaStreams = async () => {
    try {
      // Get camera stream
      const video = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      setVideoStream(video);

      // Get audio stream
      const audio = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      setAudioStream(audio);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      showToast('Please allow camera and microphone access to start the interview', 'error');
    }
  };

  const startInterviewSession = async (sessionId, config) => {
    try {
      setInterviewSession({ sessionId, config });
      setIsAiThinking(true);
      
      // Generate first AI question based on interview type and configuration
      const firstQuestion = await generateAIQuestion(config, [], 'start');
      setCurrentQuestion(firstQuestion);
      setQuestionHistory([{ question: firstQuestion, type: 'start' }]);
      setIsListening(true);
      setIsAiThinking(false);
      
      // Speak the first question
      speakQuestion(firstQuestion);
      
      console.log('Interview session started:', { sessionId, config });
    } catch (error) {
      console.error('Error starting interview session:', error);
      showToast('Failed to start interview session', 'error');
      setIsAiThinking(false);
    }
  };

  const generateAIQuestion = async (sessionConfig, previousQuestions, context) => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/interview/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewType: sessionConfig.type,
          role: sessionConfig.role,
          difficulty: sessionConfig.difficulty,
          duration: sessionConfig.duration,
          previousQuestions: previousQuestions.map(q => q.question),
          context: context,
          userEmail: sessionConfig.userEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI question');
      }

      const data = await response.json();
      return data.question;
    } catch (error) {
      console.error('Error generating AI question:', error);
      // Fallback questions based on interview type
      return getFallbackQuestion(sessionConfig.type, context);
    }
  };

  const speakQuestion = (text) => {
    if (speechSynthesis && text) {
      // Stop any current speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to use a more natural voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Natural') || 
        voice.name.includes('Premium')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  const getFallbackQuestion = (interviewType, context) => {
    const questions = {
      technical: {
        start: "Hello! Welcome to your technical interview. Can you walk me through your technical background and the programming languages you're most comfortable with?",
        followup: "That's interesting! Can you describe a challenging technical problem you've solved recently?",
        deep: "Great! Now let's dive deeper. Can you explain how you would design a scalable system architecture?",
        end: "Excellent! For our final technical question, can you walk me through your approach to debugging complex issues?"
      },
      behavioral: {
        start: "Hello! Welcome to your behavioral interview. Can you tell me about yourself and your professional background?",
        followup: "Thank you! Can you describe a situation where you had to work with a difficult team member?",
        deep: "Interesting! Can you tell me about a time when you had to make a difficult decision under pressure?",
        end: "Great! For our final question, can you describe a project where you demonstrated leadership?"
      },
      mixed: {
        start: "Hello! Welcome to your mixed interview. Can you tell me about your background and what interests you about this role?",
        followup: "Thanks! Can you describe a technical challenge you've faced and how you approached it?",
        deep: "Excellent! Can you tell me about a time when you had to learn a new technology quickly?",
        end: "Great! For our final question, can you describe how you handle competing priorities?"
      },
      practice: {
        start: "Hello! Welcome to your practice interview. Let's start with something simple - can you tell me about yourself?",
        followup: "Good! Can you describe a project you're proud of?",
        deep: "Nice! Can you tell me about a time when things didn't go as planned?",
        end: "Great job! For our final question, what are your career goals?"
      }
    };

    return questions[interviewType]?.[context] || questions[interviewType]?.start || "Can you tell me about yourself?";
  };

  const handleUserResponse = async (userAnswer) => {
    try {
      setIsAiThinking(true);
      
      // Add user response to history
      const updatedHistory = [...questionHistory];
      updatedHistory[updatedHistory.length - 1].userAnswer = userAnswer;
      setQuestionHistory(updatedHistory);

      // Generate next question based on user's response
      const nextQuestion = await generateAIQuestion(
        interviewSession.config, 
        updatedHistory, 
        updatedHistory.length >= 3 ? 'end' : 'followup'
      );
      
      setCurrentQuestion(nextQuestion);
      setQuestionHistory([...updatedHistory, { question: nextQuestion, type: 'followup' }]);
      setIsListening(true);
      setIsAiThinking(false);
      
      // Speak the next question
      speakQuestion(nextQuestion);
      
    } catch (error) {
      console.error('Error processing user response:', error);
      showToast('Error processing response', 'error');
      setIsAiThinking(false);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsListening(false);
    // Here you would start recording the user's response
    console.log('Started recording user response');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsListening(true);
    // Here you would stop recording and send the audio to the backend
    console.log('Stopped recording user response');
    
    // Simulate processing the user's response
    // In a real implementation, you would send the audio to the backend for transcription
    setTimeout(() => {
      const simulatedResponse = "Thank you for your response. I found your background very interesting.";
      handleUserResponse(simulatedResponse);
    }, 2000);
  };

  const renderStep1 = () => (
    <div className="resume-upload-step">
      <div className="step-header">
        <button className="back-to-dashboard-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft />
          Back to Dashboard
        </button>
        <h2>Upload Your Resume</h2>
        <p>Let AI analyze your resume and suggest the best interview type for you</p>
      </div>
      
      <div className="resume-upload-container">
        <div className="upload-section">
          <div className="upload-area">
            {!resumeFile ? (
              <div className="upload-zone">
                <label htmlFor="resume-upload" className="upload-label">
                  <FaUpload />
                  <span>Click to upload your resume</span>
                  <small>Supported formats: PDF, DOC, DOCX (Max 5MB)</small>
                </label>
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
                      setResumeFile(file);
                      showToast('Resume uploaded successfully!', 'success');
                    } else if (file) {
                      showToast('File size must be less than 5MB', 'error');
                    }
                  }}
                />
              </div>
            ) : (
              <div className="uploaded-file">
                <FaFileAlt />
                <span>{resumeFile.name}</span>
                <button 
                  className="remove-file"
                  onClick={() => setResumeFile(null)}
                  title="Remove file"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>

          <div className="role-selection">
            <h3>Target Role</h3>
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="role-select"
            >
              <option value="">Select your target role...</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.label}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

                     <button 
             className="analyze-resume-btn"
             onClick={analyzeResume}
             disabled={!resumeFile || !selectedRole.trim() || isAnalyzingResume}
           >
            {isAnalyzingResume ? (
              <>
                <FaSpinner className="spinning" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <FaMagic />
                Analyze Resume & Get Suggestions
              </>
            )}
          </button>
        </div>

        <div className="upload-benefits">
          <h3>Why upload your resume?</h3>
          <div className="benefits-list">
            <div className="benefit-item">
              <FaBrain />
              <div>
                <h4>AI-Powered Analysis</h4>
                <p>Our AI analyzes your skills, experience, and background</p>
              </div>
            </div>
            <div className="benefit-item">
              <FaBullseye />
              <div>
                <h4>Personalized Suggestions</h4>
                <p>Get interview type recommendations tailored to your profile</p>
              </div>
            </div>
            <div className="benefit-item">
              <FaChartLine />
              <div>
                <h4>Skill Gap Analysis</h4>
                <p>Identify areas for improvement and targeted practice</p>
              </div>
            </div>
            <div className="benefit-item">
              <FaUserTie />
              <div>
                <h4>Role-Specific Questions</h4>
                <p>Questions customized to your target role and experience level</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="ai-suggestions-step">
      <div className="step-header">
        <button className="back-button" onClick={() => setCurrentStep(1)}>
          <FaArrowLeft />
          Back to Resume Upload
        </button>
        <h2>AI Interview Suggestions</h2>
        <p>Based on your resume analysis, here are the best interview types for you</p>
      </div>

      {resumeAnalysis && (
        <div className="resume-summary">
          <h3>Resume Analysis Summary</h3>
          <div className="analysis-grid">
            <div className="analysis-item">
              <span className="label">Skills Identified:</span>
              <span className="value">{resumeAnalysis.skills_total_count ?? Object.values(resumeAnalysis.extracted_info.skills || {}).flat().length}</span>
            </div>
            <div className="analysis-item">
              <span className="label">Experience Level:</span>
              <span className="value">{resumeAnalysis.experience_positions_count ?? (resumeAnalysis.extracted_info.experience?.length || 0)} positions</span>
            </div>
            <div className="analysis-item">
              <span className="label">Role Match:</span>
              <span className="value">{resumeAnalysis.skill_match?.overall_match_percentage || 0}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="suggestions-grid">
        {suggestedInterviewTypes.map((type, index) => (
          <div 
            key={type.id}
            className={`suggestion-card ${index === 0 ? 'top-suggestion' : ''}`}
            onClick={() => handleInterviewTypeSelect(type)}
          >
            {index === 0 && (
              <div className="top-badge">
                <FaStar />
                Top Recommendation
              </div>
            )}
            
            <div className="suggestion-header">
            <div className="type-icon" style={{ color: type.color }}>
              {type.icon}
              </div>
              <div className="ai-score">
                <span>{Math.round(type.aiScore * 100)}%</span>
                <small>AI Score</small>
              </div>
            </div>
            
            <h3>{type.title}</h3>
            <p>{type.description}</p>
            
            <div className="ai-reasoning">
              <FaLightbulb />
              <p>{type.reasoning}</p>
            </div>
            
            <div className="type-features">
              {type.features.map((feature, idx) => (
                <span key={idx} className="feature-tag">{feature}</span>
              ))}
            </div>
            
            <div className="type-meta">
              <div className="meta-item">
                <FaClock />
                <span>{type.estimatedTime}</span>
              </div>
              <div className="meta-item">
                <FaStar />
                <span>{type.difficulty}</span>
              </div>
            </div>
            
            <div className="select-indicator">
              <FaArrowRight />
            </div>
          </div>
        ))}
      </div>

      <div className="alternative-options">
        <h3>Or choose from all interview types</h3>
        <div className="all-types-grid">
          {allInterviewTypes.map((type) => (
            <div 
              key={type.id}
              className="interview-type-card"
              onClick={() => handleInterviewTypeSelect(type)}
            >
              <div className="type-icon" style={{ color: type.color }}>
                {type.icon}
              </div>
              <h3>{type.title}</h3>
              <p>{type.description}</p>
              
              <div className="type-features">
                {type.features.slice(0, 2).map((feature, index) => (
                  <span key={index} className="feature-tag">{feature}</span>
                ))}
              </div>
              
              <div className="type-meta">
                <div className="meta-item">
                  <FaClock />
                  <span>{type.estimatedTime}</span>
                </div>
                <div className="meta-item">
                  <FaStar />
                  <span>{type.difficulty}</span>
                </div>
              </div>
              
              <div className="select-indicator">
                <FaArrowRight />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="interview-configuration">
      <div className="step-header">
        <button className="back-button" onClick={() => setCurrentStep(2)}>
          <FaArrowLeft />
          Back to Suggestions
        </button>
        <button className="back-to-dashboard-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft />
          Back to Dashboard
        </button>
        <h2>Configure Your Interview</h2>
        <p>Customize your interview experience</p>
      </div>

      <div className="selected-type-summary">
        <div className="selected-type-card">
          <div className="type-icon" style={{ color: selectedInterviewType.color }}>
            {selectedInterviewType.icon}
          </div>
          <div>
            <h3>{selectedInterviewType.title}</h3>
            <p>{selectedInterviewType.description}</p>
          </div>
        </div>
      </div>

      <div className="config-sections">
        {/* Role Selection */}
        <div className="config-section">
          <h3>Target Role</h3>
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            className="role-select"
          >
            <option value="">Select a role...</option>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.label}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Selection */}
        <div className="config-section">
          <h3>Difficulty Level</h3>
          <div className="difficulty-options">
            {difficultyLevels.map((level) => (
              <div
                key={level.value}
                className={`difficulty-option ${selectedDifficulty === level.value ? 'selected' : ''}`}
                onClick={() => setSelectedDifficulty(level.value)}
              >
                <div className="difficulty-header">
                  <span className="difficulty-label">{level.label}</span>
                  {selectedDifficulty === level.value && <FaCheck />}
                </div>
                <p>{level.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="config-section">
          <h3>Interview Duration</h3>
          <div className="duration-options">
            {durationOptions.map((option) => (
              <div
                key={option.value}
                className={`duration-option ${selectedDuration === option.value ? 'selected' : ''}`}
                onClick={() => setSelectedDuration(option.value)}
              >
                <div className="duration-header">
                  <span className="duration-label">{option.label}</span>
                  {selectedDuration === option.value && <FaCheck />}
                </div>
                <p>{option.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resume Summary */}
        {resumeAnalysis && (
        <div className="config-section">
            <h3>Resume Analysis</h3>
            <div className="resume-analysis-summary">
              <div className="analysis-item">
                <FaFileAlt />
                <span>Resume uploaded and analyzed</span>
              </div>
              <div className="analysis-item">
                <FaBrain />
                <span>{Object.values(resumeAnalysis.extracted_info.skills || {}).flat().length} skills identified</span>
              </div>
              <div className="analysis-item">
                <FaChartLine />
                <span>{resumeAnalysis.skill_match?.overall_match_percentage || 0}% role match</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button 
          className="start-interview-btn"
          onClick={handleStartInterview}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="loading-spinner"></div>
              Starting Interview...
            </>
          ) : (
            <>
              <FaPlay />
              Start Interview
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="interview-confirmation">
      <div className="step-header">
        <button className="back-button" onClick={() => setShowConfirmation(false)}>
          <FaArrowLeft />
          Back to Configuration
        </button>
        <h2>Confirm Your Interview Setup</h2>
        <p>Review your settings before starting the interview</p>
      </div>

      <div className="confirmation-card">
        <div className="confirmation-section">
          <h3>Interview Type</h3>
          <div className="confirmation-item">
            <div className="type-icon" style={{ color: selectedInterviewType.color }}>
              {selectedInterviewType.icon}
            </div>
            <div>
              <h4>{selectedInterviewType.title}</h4>
              <p>{selectedInterviewType.description}</p>
            </div>
          </div>
        </div>

        <div className="confirmation-section">
          <h3>Configuration</h3>
          <div className="config-summary">
            <div className="summary-item">
              <span className="label">Target Role:</span>
              <span className="value">{selectedRole}</span>
            </div>
            <div className="summary-item">
              <span className="label">Difficulty:</span>
              <span className="value">{difficultyLevels.find(l => l.value === selectedDifficulty)?.label}</span>
            </div>
            <div className="summary-item">
              <span className="label">Duration:</span>
              <span className="value">{durationOptions.find(d => d.value === selectedDuration)?.label}</span>
            </div>
            <div className="summary-item">
              <span className="label">Resume:</span>
              <span className="value">
                {resumeFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaFileAlt style={{ color: '#10b981' }} />
                    {resumeFile.name}
                  </div>
                ) : (
                  'Not uploaded'
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <button 
            className="start-interview-btn"
            onClick={confirmAndStartInterview}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Starting Interview...
              </>
            ) : (
              <>
                <FaRocket />
                Launch Interview
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderInterviewInterface = () => (
    <div className="interview-interface">
      <div className="interview-header">
        <button className="back-button" onClick={() => {
          setShowInterviewInterface(false);
          setShowConfirmation(true);
          // Stop media streams
          if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
          }
          if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
          }
        }}>
          <FaArrowLeft />
          Back to Configuration
        </button>
        <h2>Live Interview Session</h2>
        <p>AI Interviewer • {selectedInterviewType?.title}</p>
        <div className="live-timer">
          <FaClock />
          <span style={{ marginLeft: '6px' }}>{formatElapsedTime(elapsedSeconds)}</span>
        </div>
      </div>

      <div className="interview-circles-container">
        {/* AI Question Circle */}
        <div className="ai-question-circle">
          <div className="circle-content">
            <div className="ai-avatar">
              <FaBrain />
            </div>
                         <div className="question-status">
               {isAiThinking ? (
                 <div className="thinking-indicator">
                   <div className="thinking-animation">
                     <span></span>
                     <span></span>
                     <span></span>
                   </div>
                   <p>AI is thinking...</p>
                 </div>
               ) : isSpeaking ? (
                 <div className="speaking-indicator">
                   <div className="speaking-animation">
                     <span></span>
                     <span></span>
                     <span></span>
                   </div>
                   <p>AI is speaking...</p>
                 </div>
               ) : isListening ? (
                 <div className="listening-indicator">
                   <div className="pulse-dots">
                     <span></span>
                     <span></span>
                     <span></span>
                   </div>
                   <p>AI is asking...</p>
                 </div>
               ) : (
                 <div className="question-text">
                   <p>{currentQuestion}</p>
                   <button 
                     className="replay-question-btn"
                     onClick={() => speakQuestion(currentQuestion)}
                     title="Replay question"
                   >
                     <FaPlay />
                     Replay
                   </button>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* User Response Circle */}
        <div className={`user-response-circle ${isRecording ? 'recording' : ''}`}>
          <div className="circle-content">
            {videoStream ? (
              <video
                ref={(video) => {
                  if (video) video.srcObject = videoStream;
                }}
                autoPlay
                muted
                playsInline
                className="user-video"
              />
            ) : (
              <div className="camera-placeholder">
                <FaUserTie />
                <p>Camera Loading...</p>
              </div>
            )}
            
            <div className="recording-controls">
              {isRecording ? (
                <button 
                  className="stop-recording-btn"
                  onClick={handleStopRecording}
                >
                  <FaTimes />
                  Stop Recording
                </button>
              ) : (
                <button 
                  className="start-recording-btn"
                  onClick={handleStartRecording}
                  disabled={isSpeaking || isAiThinking}
                >
                  <FaMicrophone />
                  Start Response
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="interview-controls">
        <div className="control-info">
          <div className="info-item">
            <FaClock />
            <span>Duration: {selectedDuration} minutes</span>
          </div>
          <div className="info-item">
            <FaUserTie />
            <span>Role: {selectedRole}</span>
          </div>
          <div className="info-item">
            <FaStar />
            <span>Difficulty: {difficultyLevels.find(l => l.value === selectedDifficulty)?.label}</span>
          </div>
        </div>
        
        <div className="action-controls">
          <button 
            className={`pause-btn ${isPaused ? 'paused' : ''}`}
            onClick={() => handlePauseResume()}
          >
            {isPaused ? <FaPlay /> : <FaCog />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button 
            className="end-interview-btn"
            onClick={handleEndInterview}
          >
            <FaTimes />
            End Interview
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="start-interview-page">
      <div className="page-container">
        {showInterviewInterface ? renderInterviewInterface() :
         showConfirmation ? renderConfirmationStep() : 
         currentStep === 1 ? renderStep1() : 
         currentStep === 2 ? renderStep2() : 
         renderStep3()}
      </div>
    </div>
  );
};

export default StartInterviewPage; 