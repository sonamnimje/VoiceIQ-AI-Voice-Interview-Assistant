import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaPause, FaStop, FaMicrophone, FaMicrophoneSlash, FaHistory, FaBullseye } from 'react-icons/fa';
import { formatTime, calculateScore, savePracticeSession } from '../components/PracticeUtils';
import PracticeHistory from '../components/PracticeHistory';
import CustomInterviewModes from '../components/CustomInterviewModes';
import ModernPopup from '../components/ModernPopup';
import { showToast } from '../components/Toast';
import './PracticePage.css';

const PRACTICE_MODES = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Basic questions with helpful hints',
    difficulty: 1,
    color: '#4ade80'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Standard interview questions',
    difficulty: 2,
    color: '#fbbf24'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Challenging technical questions',
    difficulty: 3,
    color: '#f87171'
  },
  {
    id: 'behavioral',
    name: 'Behavioral',
    description: 'STAR method focused questions',
    difficulty: 2,
    color: '#a78bfa'
  }
];

const PracticePage = () => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCustomModes, setShowCustomModes] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const navigate = useNavigate();

  const questions = {
    beginner: [
      "Tell me about yourself.",
      "What are your strengths?",
      "Why do you want this job?",
      "Where do you see yourself in 5 years?",
      "What is your greatest achievement?"
    ],
    intermediate: [
      "Describe a challenging project you worked on.",
      "How do you handle tight deadlines?",
      "Tell me about a time you had to learn something quickly.",
      "How do you stay updated with industry trends?",
      "Describe a situation where you had to work with a difficult team member."
    ],
    advanced: [
      "Explain a complex technical concept to a non-technical person.",
      "How would you optimize a slow-performing application?",
      "Describe a time when you had to make a difficult technical decision.",
      "How do you approach debugging a production issue?",
      "Tell me about a time you had to refactor legacy code."
    ],
    behavioral: [
      "Describe a situation where you had to overcome a major obstacle.",
      "Tell me about a time you had to lead a team through a difficult change.",
      "Give me an example of when you had to make a decision without all the information.",
      "Describe a time when you had to resolve a conflict between team members.",
      "Tell me about a time you failed and what you learned from it."
    ]
  };

  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const startPractice = (mode) => {
    setSelectedMode(mode);
    setCurrentQuestion(questions[mode][0]);
    setQuestionIndex(0);
    setTimer(0);
    setTranscript('');
    setAnswers([]);
    setShowResults(false);
    showToast(`Started ${PRACTICE_MODES.find(m => m.id === mode)?.name} practice mode`, 'info');
  };

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    showToast('Recording started', 'success');
  };

  const pauseRecording = () => {
    setIsPaused(true);
    showToast('Recording paused', 'warning');
  };

  const resumeRecording = () => {
    setIsPaused(false);
    showToast('Recording resumed', 'success');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    
    // Save the practice session
    const sessionData = {
      mode: selectedMode,
      answers: answers,
      duration: timer,
      score: calculateScore(answers, selectedMode)
    };
    savePracticeSession(sessionData);
    
    setShowResults(true);
    showToast('Practice session completed!', 'success');
  };

  const nextQuestion = () => {
    if (questionIndex < questions[selectedMode].length - 1) {
      setQuestionIndex(prev => prev + 1);
      setCurrentQuestion(questions[selectedMode][questionIndex + 1]);
      showToast(`Question ${questionIndex + 2} of ${questions[selectedMode].length}`, 'info');
    }
  };

  const getFeedback = () => {
    const feedback = {
      beginner: "Great start! You're building a solid foundation. Consider adding more specific examples to your answers.",
      intermediate: "Good progress! Your answers show experience. Try to use the STAR method more consistently.",
      advanced: "Excellent technical depth! Your problem-solving approach is strong. Consider adding more business context.",
      behavioral: "Strong behavioral responses! You're using the STAR method well. Try to quantify your achievements more."
    };
    return feedback[selectedMode];
  };

  const handleCustomModeSelect = (mode) => {
    setShowCustomModes(false);
    setPopupConfig({
      title: 'Custom Mode Selected',
      message: `You selected ${mode.name} mode. This will provide personalized questions based on your preferences.`,
      type: 'success'
    });
    setShowPopup(true);
  };

  const handleQuestionsGenerated = (questions, config) => {
    showToast(`Generated ${questions.length} questions for ${config.name}`, 'success');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (showCustomModes) {
    return (
      <div className="practice-container">
        <div className="practice-header">
          <button 
            className="back-button"
            onClick={() => setShowCustomModes(false)}
          >
            ← Back to Practice Modes
          </button>
          <h2>Custom Interview Modes</h2>
        </div>
        <CustomInterviewModes 
          onModeSelect={handleCustomModeSelect}
          onQuestionsGenerated={handleQuestionsGenerated}
        />
      </div>
    );
  }

  if (selectedMode) {
    return (
      <div className="practice-container">
        <div className="practice-header">
          <button 
            className="back-button"
            onClick={() => setSelectedMode(null)}
          >
            ← Back to Practice Modes
          </button>
          <div className="mode-info">
            <h2 style={{ color: PRACTICE_MODES.find(m => m.id === selectedMode)?.color }}>
              {PRACTICE_MODES.find(m => m.id === selectedMode)?.name} Practice
            </h2>
            <div className="timer">{formatTime(timer)}</div>
          </div>
        </div>

        <div className="practice-content">
          <div className="question-section">
            <h3>Question {questionIndex + 1} of {questions[selectedMode].length}</h3>
            <div className="question-card">
              <p>{currentQuestion}</p>
            </div>
          </div>

          <div className="recording-section">
            <div className="recording-controls">
              {!isRecording ? (
                <button 
                  className="record-button"
                  onClick={startRecording}
                >
                  <FaMicrophone /> Start Recording
                </button>
              ) : (
                <div className="recording-buttons">
                  {isPaused ? (
                    <button 
                      className="resume-button"
                      onClick={resumeRecording}
                    >
                      <FaPlay /> Resume
                    </button>
                  ) : (
                    <button 
                      className="pause-button"
                      onClick={pauseRecording}
                    >
                      <FaPause /> Pause
                    </button>
                  )}
                  <button 
                    className="stop-button"
                    onClick={stopRecording}
                  >
                    <FaStop /> Stop
                  </button>
                </div>
              )}
            </div>



            {isRecording && (
              <div className="recording-indicator">
                <div className="pulse-dot"></div>
                {isPaused ? 'Paused...' : 'Recording...'}
              </div>
            )}
          </div>

          {questionIndex < questions[selectedMode].length - 1 && (
            <button 
              className="next-question-button"
              onClick={nextQuestion}
            >
              Next Question
            </button>
          )}
        </div>

        {showResults && (
          <div className="results-modal">
            <div className="results-content">
              <h3>Practice Session Complete!</h3>
              <div className="results-stats">
                <div className="stat">
                  <span className="stat-label">Duration:</span>
                  <span className="stat-value">{formatTime(timer)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Questions Answered:</span>
                  <span className="stat-value">{questionIndex + 1}</span>
                </div>
              </div>
              <div className="feedback">
                <h4>Feedback:</h4>
                <p>{getFeedback()}</p>
              </div>
              <div className="results-actions">
                <button 
                  className="restart-button"
                  onClick={() => startPractice(selectedMode)}
                >
                  Practice Again
                </button>
                <button 
                  className="back-to-modes-button"
                  onClick={() => setSelectedMode(null)}
                >
                  Choose Different Mode
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showHistory) {
    return <PracticeHistory onClose={() => setShowHistory(false)} />;
  }

  return (
    <div className="practice-modes-container">
      <div className="practice-header">
        <div className="header-content">
          <h1>Practice Interview Modes</h1>
        </div>
        <div className="header-actions">
          <button 
            className="back-to-dashboard-button"
            onClick={handleBackToDashboard}
          >
            🏠 Back to Dashboard
          </button>
          <button 
            className="custom-modes-button"
            onClick={() => setShowCustomModes(true)}
          >
            <FaBullseye /> Custom Modes
          </button>
          <button 
            className="history-button"
            onClick={() => setShowHistory(true)}
          >
            <FaHistory /> Practice History
          </button>
        </div>
      </div>

      <div className="modes-grid">
        {PRACTICE_MODES.map((mode) => (
          <div 
            key={mode.id}
            className="mode-card"
            onClick={() => startPractice(mode.id)}
          >
            <div 
              className="mode-icon"
              style={{ backgroundColor: mode.color }}
            >
              {mode.difficulty === 1 && '★'}
              {mode.difficulty === 2 && '★★'}
              {mode.difficulty === 3 && '★★★'}
            </div>
            <h3>{mode.name}</h3>
            <p>{mode.description}</p>
            <div className="mode-difficulty">
              Difficulty: {mode.difficulty}/3
            </div>
          </div>
        ))}
      </div>

      <div className="practice-tips">
        <h3>Practice Tips:</h3>
        <ul>
          <li>Speak clearly and at a moderate pace</li>
          <li>Use specific examples from your experience</li>
          <li>Structure your answers using the STAR method</li>
          <li>Practice active listening and responding thoughtfully</li>
          <li>Record yourself to identify areas for improvement</li>
        </ul>
      </div>

      {/* Modern Popup */}
      <ModernPopup
        open={showPopup}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
};

export default PracticePage; 