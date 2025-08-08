import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaChartLine, 
  FaLightbulb, 
  FaBrain, 
  FaUserTie, 
  FaMicrophone, 
  FaClock, 
  FaStar, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaRocket, 
  FaHistory, 
  FaDownload,
  FaShare,
  FaEye,
  FaEyeSlash,
  FaBullseye,
  FaTrophy,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaBell,
  FaCog,
  FaPlay,
  FaPause,
  FaStop,
  FaVolumeUp,
  FaVolumeMute,
  FaPlus
} from 'react-icons/fa';
import config from '../config';
import { showToast } from '../components/Toast';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId, fromInterview, fromPractice } = location.state || {};
  
  const [loading, setLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, comparison
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: '', deadline: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // all, interviews, practice
  const [sortBy, setSortBy] = useState('date'); // date, score, duration
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadFeedbackData();
    loadGoals();
    loadNotifications();
  }, [sessionId]);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      
      const userEmail = localStorage.getItem('user_email');
      console.log('Loading feedback data for user:', userEmail);
      
      if (!userEmail) {
        console.log('No user email found, using demo mode');
        showToast('Showing demo data. Log in to see your actual feedback.', 'info');
        // Enhanced demo data
        setInterviewHistory([
          {
            sessionId: 'demo-1',
            role: 'Software Engineer',
            interviewMode: 'technical',
            status: 'completed',
            startTime: '2024-01-15T10:30:00Z',
            endTime: '2024-01-15T11:00:00Z',
            duration: 1800,
            overallScore: 8.5,
            technicalScore: 9.0,
            communicationScore: 8.0,
            confidenceScore: 7.5,
            questionsAnswered: 12,
            feedback: {
              strengths: ['Strong technical knowledge', 'Clear communication', 'Good problem-solving approach', 'Excellent code quality'],
              improvements: ['Could provide more examples', 'Practice time management', 'Work on system design depth'],
              detailedAnalysis: {
                technical: { score: 9.0, feedback: 'Excellent technical skills demonstrated' },
                communication: { score: 8.0, feedback: 'Good communication, could be more concise' },
                problemSolving: { score: 8.5, feedback: 'Strong analytical thinking' },
                confidence: { score: 7.5, feedback: 'Good confidence, room for improvement' }
              }
            }
          },
          {
            sessionId: 'demo-2',
            role: 'Software Engineer',
            interviewMode: 'behavioral',
            status: 'completed',
            startTime: '2024-01-14T14:20:00Z',
            endTime: '2024-01-14T14:50:00Z',
            duration: 1800,
            overallScore: 7.8,
            technicalScore: 7.5,
            communicationScore: 8.5,
            confidenceScore: 8.0,
            questionsAnswered: 8,
            feedback: {
              strengths: ['Excellent communication skills', 'Good team collaboration examples', 'Strong leadership stories'],
              improvements: ['Could provide more specific metrics', 'Practice STAR method', 'Include more quantifiable results'],
              detailedAnalysis: {
                technical: { score: 7.5, feedback: 'Good technical understanding' },
                communication: { score: 8.5, feedback: 'Excellent communication skills' },
                problemSolving: { score: 7.8, feedback: 'Good problem-solving approach' },
                confidence: { score: 8.0, feedback: 'Confident presentation' }
              }
            }
          },
          {
            sessionId: 'demo-3',
            role: 'Senior Developer',
            interviewMode: 'system-design',
            status: 'completed',
            startTime: '2024-01-13T09:15:00Z',
            endTime: '2024-01-13T10:00:00Z',
            duration: 2700,
            overallScore: 6.5,
            technicalScore: 6.0,
            communicationScore: 7.0,
            confidenceScore: 6.5,
            questionsAnswered: 3,
            feedback: {
              strengths: ['Good system thinking', 'Clear communication of ideas'],
              improvements: ['Need more system design practice', 'Work on scalability concepts', 'Improve technical depth'],
              detailedAnalysis: {
                technical: { score: 6.0, feedback: 'Basic system design understanding' },
                communication: { score: 7.0, feedback: 'Good communication of ideas' },
                problemSolving: { score: 6.5, feedback: 'Decent problem-solving approach' },
                confidence: { score: 6.5, feedback: 'Moderate confidence level' }
              }
            }
          }
        ]);
        
        setPracticeHistory([
          {
            id: 'demo-practice-1',
            type: 'practice',
            mode: 'beginner',
            score: 7.5,
            duration: 1800,
            created_at: '2024-01-15T10:30:00Z',
            questions_answered: 5,
            category: 'technical'
          },
          {
            id: 'demo-practice-2',
            type: 'practice',
            mode: 'intermediate',
            score: 8.2,
            duration: 2400,
            created_at: '2024-01-14T14:20:00Z',
            questions_answered: 7,
            category: 'behavioral'
          },
          {
            id: 'demo-practice-3',
            type: 'practice',
            mode: 'advanced',
            score: 6.8,
            duration: 3000,
            created_at: '2024-01-13T16:45:00Z',
            questions_answered: 10,
            category: 'system-design'
          }
        ]);
        
        // Generate AI suggestions for demo mode
        await generateAISuggestions();
        
        setLoading(false);
        return;
      }
      
      // Load interview history
      console.log('Fetching interview history from:', `${config.BACKEND_URL}/api/interview/history`);
      const interviewResponse = await fetch(`${config.BACKEND_URL}/api/interview/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
        credentials: 'include'
      });

      console.log('Interview history response status:', interviewResponse.status);
      if (interviewResponse.ok) {
        const interviewData = await interviewResponse.json();
        console.log('Interview history data:', interviewData);
        setInterviewHistory(interviewData.sessions || []);
      } else {
        console.error('Interview history request failed:', interviewResponse.status, interviewResponse.statusText);
        const errorText = await interviewResponse.text();
        console.error('Error response:', errorText);
      }

      // Load practice history
      console.log('Fetching practice history from:', `${config.BACKEND_URL}/api/practice/history`);
      const practiceResponse = await fetch(`${config.BACKEND_URL}/api/practice/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
        credentials: 'include'
      });

      console.log('Practice history response status:', practiceResponse.status);
      if (practiceResponse.ok) {
        const practiceData = await practiceResponse.json();
        console.log('Practice history data:', practiceData);
        setPracticeHistory(practiceData.sessions || []);
      } else {
        console.error('Practice history request failed:', practiceResponse.status, practiceResponse.statusText);
        const errorText = await practiceResponse.text();
        console.error('Error response:', errorText);
      }

      // Load specific session feedback if sessionId is provided
      if (sessionId) {
        console.log('Fetching session feedback for sessionId:', sessionId);
        const feedbackResponse = await fetch(`${config.BACKEND_URL}/api/feedback/session/${sessionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
          },
          credentials: 'include'
        });

        if (feedbackResponse.ok) {
          const feedback = await feedbackResponse.json();
          setFeedbackData(feedback);
        } else {
          console.error('Session feedback request failed:', feedbackResponse.status, feedbackResponse.statusText);
        }
      }

      // Generate AI suggestions
      await generateAISuggestions();

    } catch (error) {
      console.error('Error loading feedback data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        config: config.BACKEND_URL
      });
      showToast('Failed to load feedback data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = () => {
    const savedGoals = localStorage.getItem('feedback_goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
      // Default goals
      setGoals([
        {
          id: 1,
          title: 'Improve Technical Score',
          target: 8.5,
          current: 7.8,
          deadline: '2024-02-15',
          category: 'technical',
          progress: 78
        },
        {
          id: 2,
          title: 'Complete 10 Practice Sessions',
          target: 10,
          current: 6,
          deadline: '2024-02-01',
          category: 'practice',
          progress: 60
        },
        {
          id: 3,
          title: 'Master System Design',
          target: 8.0,
          current: 6.5,
          deadline: '2024-03-01',
          category: 'system-design',
          progress: 65
        }
      ]);
    }
  };

  const loadNotifications = () => {
    setNotifications([
      {
        id: 1,
        type: 'achievement',
        message: 'Congratulations! You\'ve improved your technical score by 15%',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 2,
        type: 'reminder',
        message: 'You have a practice session scheduled for tomorrow',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 3,
        type: 'suggestion',
        message: 'Try the advanced system design practice mode',
        timestamp: new Date().toISOString(),
        read: true
      }
    ]);
  };

  const generateAISuggestions = async () => {
    try {
      const userEmail = localStorage.getItem('user_email');
      
      if (!userEmail) {
        // Enhanced demo AI suggestions
        setAiSuggestions({
          suggestions: {
            focusAreas: [
              "Improve technical depth in system design questions",
              "Enhance communication clarity and structure",
              "Build confidence in behavioral responses",
              "Practice time management during interviews",
              "Strengthen problem-solving methodology",
              "Develop leadership and teamwork examples"
            ],
            recommendedActions: [
              "Complete 2-3 practice sessions per week",
              "Focus on STAR method for behavioral questions",
              "Review system design fundamentals",
              "Record and analyze your responses",
              "Join mock interview groups",
              "Study advanced algorithms and data structures"
            ],
            practiceRecommendations: [
              "Start with beginner mode to build confidence",
              "Progress to intermediate for balanced practice",
              "Use advanced mode for challenging scenarios",
              "Focus on behavioral questions for leadership roles",
              "Practice system design with real-world scenarios",
              "Work on time management in timed sessions"
            ],
            nextSteps: [
              "Schedule a mock interview this week",
              "Review your weakest areas identified",
              "Practice with a friend or mentor",
              "Set specific improvement goals",
              "Create a study schedule",
              "Track your progress weekly"
            ],
            personalizedInsights: [
              "Your technical skills are strong but need more depth in system design",
              "Communication is improving steadily - keep practicing",
              "Consider focusing on behavioral questions for senior roles",
              "Your confidence has increased by 15% this month"
            ]
          },
          analysis_summary: {
            total_interviews: 3,
            total_practice_sessions: 3,
            average_score: 7.6,
            performance_trend: "improving",
            improvement_rate: 15,
            strongest_area: "communication",
            weakest_area: "system_design",
            recommended_focus: "technical_depth"
          },
          predictive_insights: {
            projected_score_1month: 8.2,
            projected_score_3months: 8.8,
            confidence_level: "high",
            key_milestones: [
              "Reach 8.0 average score by end of month",
              "Complete 15 practice sessions",
              "Master 3 system design patterns"
            ]
          }
        });
        return;
      }
      
      const response = await fetch(`${config.BACKEND_URL}/api/feedback/ai-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
        credentials: 'include',
        body: JSON.stringify({
          interviewHistory: interviewHistory,
          practiceHistory: practiceHistory,
          timeframe: selectedTimeframe
        })
      });

      if (response.ok) {
        const suggestions = await response.json();
        setAiSuggestions(suggestions);
      } else {
        console.error('AI suggestions request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  };

  const exportFeedbackReport = async () => {
    try {
      setExporting(true);
      
      const userEmail = localStorage.getItem('user_email');
      const response = await fetch(`${config.BACKEND_URL}/api/feedback/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
        credentials: 'include',
        body: JSON.stringify({
          interviewHistory: interviewHistory,
          practiceHistory: practiceHistory,
          aiSuggestions: aiSuggestions,
          timeframe: selectedTimeframe
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feedback-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Feedback report exported successfully!', 'success');
      }
    } catch (error) {
      console.error('Error exporting feedback:', error);
      showToast('Failed to export feedback report', 'error');
    } finally {
      setExporting(false);
    }
  };

  const shareFeedback = async () => {
    try {
      const shareData = {
        title: 'My Interview Feedback Report',
        text: 'Check out my interview performance feedback and AI suggestions!',
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
        showToast('Feedback shared successfully!', 'success');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error sharing feedback:', error);
      showToast('Failed to share feedback', 'error');
    }
  };

  const getPerformanceTrend = () => {
    if (interviewHistory.length < 2) return 'insufficient';
    
    const recentScores = interviewHistory
      .slice(-5)
      .map(session => session.overall_score || session.score || 0);
    
    const firstHalf = recentScores.slice(0, Math.ceil(recentScores.length / 2));
    const secondHalf = recentScores.slice(Math.ceil(recentScores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 1) return 'improving';
    if (secondAvg < firstAvg - 1) return 'declining';
    return 'stable';
  };

  const getOverallStats = () => {
    const totalInterviews = interviewHistory.length;
    const totalPractice = practiceHistory.length;
    const avgInterviewScore = interviewHistory.length > 0 
      ? interviewHistory.reduce((sum, session) => sum + (session.overall_score || session.score || 0), 0) / interviewHistory.length 
      : 0;
    const totalTime = interviewHistory.reduce((sum, session) => sum + (session.duration || 0), 0) + 
                     practiceHistory.reduce((sum, session) => sum + (session.duration || 0), 0);

    return {
      totalInterviews,
      totalPractice,
      avgInterviewScore: Math.round(avgInterviewScore * 10) / 10,
      totalTime: Math.round(totalTime / 60), // Convert to minutes
      performanceTrend: getPerformanceTrend()
    };
  };

  const getStrengthsAndWeaknesses = () => {
    const allFeedback = interviewHistory
      .filter(session => session.feedback)
      .map(session => session.feedback);

    const strengths = [];
    const weaknesses = [];

    allFeedback.forEach(feedback => {
      if (feedback.strengths) {
        strengths.push(...feedback.strengths);
      }
      if (feedback.improvements) {
        weaknesses.push(...feedback.improvements);
      }
    });

    // Count occurrences and get top items
    const strengthCounts = {};
    const weaknessCounts = {};

    strengths.forEach(strength => {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    });

    weaknesses.forEach(weakness => {
      weaknessCounts[weakness] = (weaknessCounts[weakness] || 0) + 1;
    });

    const topStrengths = Object.entries(strengthCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([strength]) => strength);

    const topWeaknesses = Object.entries(weaknessCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([weakness]) => weakness);

    return { topStrengths, topWeaknesses };
  };

  // New helper functions
  const addGoal = () => {
    if (newGoal.title && newGoal.target && newGoal.deadline) {
      const goal = {
        id: Date.now(),
        title: newGoal.title,
        target: parseFloat(newGoal.target),
        current: 0,
        deadline: newGoal.deadline,
        category: 'general',
        progress: 0
      };
      const updatedGoals = [...goals, goal];
      setGoals(updatedGoals);
      localStorage.setItem('feedback_goals', JSON.stringify(updatedGoals));
      setNewGoal({ title: '', target: '', deadline: '' });
      setShowGoalModal(false);
      showToast('Goal added successfully!', 'success');
    }
  };

  const updateGoalProgress = (goalId, newProgress) => {
    const updatedGoals = goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, current: newProgress, progress: Math.round((newProgress / goal.target) * 100) }
        : goal
    );
    setGoals(updatedGoals);
    localStorage.setItem('feedback_goals', JSON.stringify(updatedGoals));
  };

  const deleteGoal = (goalId) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    setGoals(updatedGoals);
    localStorage.setItem('feedback_goals', JSON.stringify(updatedGoals));
    showToast('Goal deleted successfully!', 'success');
  };

  const getFilteredSessions = () => {
    let sessions = [...interviewHistory, ...practiceHistory];
    
    // Filter by mode
    if (filterMode === 'interviews') {
      sessions = sessions.filter(session => session.type !== 'practice');
    } else if (filterMode === 'practice') {
      sessions = sessions.filter(session => session.type === 'practice');
    }
    
    // Filter by search term
    if (searchTerm) {
      sessions = sessions.filter(session => 
        session.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.interviewMode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.mode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort sessions
    sessions.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.overallScore || b.score || 0) - (a.overallScore || a.score || 0);
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'date':
        default:
          return new Date(b.created_at || b.startTime) - new Date(a.created_at || a.startTime);
      }
    });
    
    return sessions;
  };

  const getPerformanceChartData = () => {
    const sessions = interviewHistory.slice(-10); // Last 10 sessions
    return sessions.map((session, index) => ({
      session: index + 1,
      score: session.overallScore || session.score || 0,
      technical: session.technicalScore || 0,
      communication: session.communicationScore || 0,
      confidence: session.confidenceScore || 0
    }));
  };

  const getCategoryBreakdown = () => {
    const categories = {};
    [...interviewHistory, ...practiceHistory].forEach(session => {
      const category = session.interviewMode || session.category || 'general';
      if (!categories[category]) {
        categories[category] = { count: 0, totalScore: 0 };
      }
      categories[category].count++;
      categories[category].totalScore += session.overallScore || session.score || 0;
    });
    
    return Object.entries(categories).map(([category, data]) => ({
      category,
      count: data.count,
      averageScore: Math.round((data.totalScore / data.count) * 10) / 10
    }));
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const getUnreadNotificationsCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  if (loading) {
    return (
      <div className="feedback-loading">
        <div className="loading-spinner"></div>
        <p>Loading your feedback data...</p>
      </div>
    );
  }

  const stats = getOverallStats();
  const { topStrengths, topWeaknesses } = getStrengthsAndWeaknesses();

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <div className="header-content">
          <h1>Performance Feedback & AI Insights</h1>
          <p>Comprehensive analysis of your interview and practice sessions</p>
        </div>

        <div className="header-actions">
          <div className="view-mode-toggle">
            <button 
              className={`mode-btn ${viewMode === 'overview' ? 'active' : ''}`}
              onClick={() => setViewMode('overview')}
            >
              <FaChartLine />
              Overview
            </button>
            <button 
              className={`mode-btn ${viewMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              <FaEye />
              Detailed
            </button>
            <button 
              className={`mode-btn ${viewMode === 'comparison' ? 'active' : ''}`}
              onClick={() => setViewMode('comparison')}
            >
              <FaChartLine />
              Compare
            </button>
          </div>

          <div className="header-controls">
            <div className="notification-container">
              <button 
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FaBell />
                {getUnreadNotificationsCount() > 0 && (
                  <span className="notification-badge">{getUnreadNotificationsCount()}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    <button onClick={() => setShowNotifications(false)}>×</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="notification-icon">
                          {notification.type === 'achievement' && <FaTrophy />}
                          {notification.type === 'reminder' && <FaBell />}
                          {notification.type === 'suggestion' && <FaLightbulb />}
                        </div>
                        <div className="notification-content">
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!localStorage.getItem('user_email') && (
              <button 
                className="login-btn"
                onClick={() => navigate('/login')}
              >
                <FaUserTie />
                Login
              </button>
            )}
            
            <button 
              className="export-btn"
              onClick={exportFeedbackReport}
              disabled={exporting}
            >
              <FaDownload />
              {exporting ? 'Exporting...' : 'Export Report'}
            </button>
            
            <button 
              className="share-btn"
              onClick={shareFeedback}
            >
              <FaShare />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="feedback-content">
        {/* Goals Section */}
        <div className="goals-section">
          <div className="goals-header">
            <h2>
              <FaBullseye />
              Your Goals & Progress
            </h2>
            <button 
              className="add-goal-btn"
              onClick={() => setShowGoalModal(true)}
            >
              <FaPlus />
              Add Goal
            </button>
          </div>
          
          <div className="goals-grid">
            {goals.map(goal => (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <h3>{goal.title}</h3>
                  <div className="goal-actions">
                    <button 
                      className="goal-action-btn"
                      onClick={() => updateGoalProgress(goal.id, Math.min(goal.current + 1, goal.target))}
                    >
                      +
                    </button>
                    <button 
                      className="goal-action-btn delete"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {goal.current}/{goal.target} ({goal.progress}%)
                  </div>
                </div>
                
                <div className="goal-details">
                  <span className="goal-deadline">
                    <FaCalendarAlt />
                    {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                  <span className="goal-category">{goal.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">
              <FaUserTie />
            </div>
            <div className="stat-content">
              <h3>{stats.totalInterviews}</h3>
              <p>Interviews Completed</p>
              <div className="stat-trend">
                <FaChartLine />
                +12% this month
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaMicrophone />
            </div>
            <div className="stat-content">
              <h3>{stats.totalPractice}</h3>
              <p>Practice Sessions</p>
              <div className="stat-trend">
                <FaChartLine />
                +8% this week
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaStar />
            </div>
            <div className="stat-content">
              <h3>{stats.avgInterviewScore}/10</h3>
              <p>Average Score</p>
              <div className="stat-trend">
                <FaChartLine />
                +0.5 this month
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-content">
              <h3>{stats.totalTime}m</h3>
              <p>Total Time</p>
              <div className="stat-trend">
                <FaChartLine />
                +2h this week
              </div>
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="performance-trend">
          <h2>Performance Trend</h2>
          <div className={`trend-indicator ${stats.performanceTrend}`}>
            {stats.performanceTrend === 'improving' && (
              <>
                <FaChartLine className="trend-icon improving" />
                <span>Your performance is improving! Keep up the great work.</span>
              </>
            )}
            {stats.performanceTrend === 'stable' && (
              <>
                <FaChartLine className="trend-icon stable" />
                <span>Your performance is stable. Consider pushing yourself further.</span>
              </>
            )}
            {stats.performanceTrend === 'declining' && (
              <>
                <FaChartLine className="trend-icon declining" />
                <span>Your performance has declined. Focus on the areas below.</span>
              </>
            )}
            {stats.performanceTrend === 'insufficient' && (
              <>
                <FaChartLine className="trend-icon insufficient" />
                <span>Complete more interviews to see your performance trend.</span>
              </>
            )}
          </div>
        </div>

        {/* Enhanced AI Suggestions */}
        {aiSuggestions && (
          <div className="ai-suggestions">
            <h2>
              <FaLightbulb />
              AI-Powered Insights & Recommendations
            </h2>
            
            <div className="ai-insights-overview">
              <div className="insight-card primary">
                <div className="insight-icon">
                  <FaChartLine />
                </div>
                <div className="insight-content">
                  <h3>Performance Trend</h3>
                  <p className="insight-value">{aiSuggestions.analysis_summary?.improvement_rate || 15}% improvement</p>
                  <p className="insight-description">Your performance is trending upward consistently</p>
                </div>
              </div>
              
              <div className="insight-card">
                <div className="insight-icon">
                  <FaStar />
                </div>
                <div className="insight-content">
                  <h3>Strongest Area</h3>
                  <p className="insight-value">{aiSuggestions.analysis_summary?.strongest_area || 'communication'}</p>
                  <p className="insight-description">Keep leveraging this strength</p>
                </div>
              </div>
              
              <div className="insight-card">
                <div className="insight-icon">
                  <FaExclamationTriangle />
                </div>
                <div className="insight-content">
                  <h3>Focus Area</h3>
                  <p className="insight-value">{aiSuggestions.analysis_summary?.weakest_area || 'system_design'}</p>
                  <p className="insight-description">Priority improvement area</p>
                </div>
              </div>
            </div>
            
            <div className="suggestions-grid">
              <div className="suggestion-card">
                <h3>Focus Areas</h3>
                <ul>
                  {aiSuggestions.suggestions?.focusAreas?.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>

              <div className="suggestion-card">
                <h3>Recommended Actions</h3>
                <ul>
                  {aiSuggestions.suggestions?.recommendedActions?.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>

              <div className="suggestion-card">
                <h3>Practice Recommendations</h3>
                <ul>
                  {aiSuggestions.suggestions?.practiceRecommendations?.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="suggestion-card">
                <h3>Personalized Insights</h3>
                <ul>
                  {aiSuggestions.suggestions?.personalizedInsights?.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>

            {aiSuggestions.predictive_insights && (
              <div className="predictive-insights">
                <h3>Predictive Analysis</h3>
                <div className="predictive-grid">
                  <div className="prediction-card">
                    <h4>1 Month Projection</h4>
                    <p className="prediction-score">{aiSuggestions.predictive_insights.projected_score_1month}/10</p>
                    <p>Expected average score</p>
                  </div>
                  <div className="prediction-card">
                    <h4>3 Month Projection</h4>
                    <p className="prediction-score">{aiSuggestions.predictive_insights.projected_score_3months}/10</p>
                    <p>Long-term potential</p>
                  </div>
                  <div className="prediction-card">
                    <h4>Confidence Level</h4>
                    <p className="prediction-score">{aiSuggestions.predictive_insights.confidence_level}</p>
                    <p>Prediction accuracy</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Strengths and Weaknesses */}
        <div className="analysis-section">
          <div className="strengths-section">
            <h2>
              <FaCheckCircle />
              Your Strengths
            </h2>
            <div className="strengths-list">
              {topStrengths.map((strength, index) => (
                <div key={index} className="strength-item">
                  <span className="strength-badge">✓</span>
                  {strength}
                </div>
              ))}
            </div>
          </div>

          <div className="weaknesses-section">
            <h2>
              <FaExclamationTriangle />
              Areas for Improvement
            </h2>
            <div className="weaknesses-list">
              {topWeaknesses.map((weakness, index) => (
                <div key={index} className="weakness-item">
                  <span className="weakness-badge">!</span>
                  {weakness}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Sessions Section */}
        <div className="recent-sessions">
          <div className="sessions-header">
            <h2>Session History</h2>
            <div className="sessions-controls">
              <div className="search-filter-container">
                <div className="search-box">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="filter-controls">
                  <select 
                    value={filterMode} 
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Sessions</option>
                    <option value="interviews">Interviews Only</option>
                    <option value="practice">Practice Only</option>
                  </select>
                  
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="score">Sort by Score</option>
                    <option value="duration">Sort by Duration</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sessions-tabs">
            <button 
              className={`tab-btn ${selectedTimeframe === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTimeframe('all')}
            >
              All Time
            </button>
            <button 
              className={`tab-btn ${selectedTimeframe === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedTimeframe('month')}
            >
              This Month
            </button>
            <button 
              className={`tab-btn ${selectedTimeframe === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedTimeframe('week')}
            >
              This Week
            </button>
          </div>

          <div className="sessions-list">
            {getFilteredSessions()
              .slice(0, 10)
              .map((session, index) => (
                <div key={index} className="session-card enhanced">
                  <div className="session-header">
                    <div className="session-type">
                      {session.type === 'practice' ? (
                        <FaMicrophone className="practice-icon" />
                      ) : (
                        <FaUserTie className="interview-icon" />
                      )}
                      <div className="session-info">
                        <span className="session-title">
                          {session.type === 'practice' ? 'Practice' : 'Interview'}
                        </span>
                        <span className="session-subtitle">
                          {session.role || session.mode || 'General'}
                        </span>
                      </div>
                    </div>
                    <div className="session-date">
                      {new Date(session.created_at || session.startTime).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="session-details">
                    <div className="session-score">
                      <span className="score-label">Score:</span>
                      <span className="score-value">{session.overall_score || session.score || 'N/A'}/10</span>
                    </div>
                    <div className="session-duration">
                      <span className="duration-label">Duration:</span>
                      <span className="duration-value">{Math.round((session.duration || 0) / 60)}m</span>
                    </div>
                    {session.questionsAnswered && (
                      <div className="session-questions">
                        <span className="questions-label">Questions:</span>
                        <span className="questions-value">{session.questionsAnswered}</span>
                      </div>
                    )}
                  </div>

                  <div className="session-actions">
                    {session.feedback && (
                      <button 
                        className="view-feedback-btn"
                        onClick={() => setShowDetailedFeedback(session)}
                      >
                        <FaEye />
                        View Feedback
                      </button>
                    )}
                    <button 
                      className="session-action-btn"
                      onClick={() => {
                        // Add to comparison
                        if (selectedSessions.includes(session.sessionId || session.id)) {
                          setSelectedSessions(selectedSessions.filter(id => id !== (session.sessionId || session.id)));
                        } else {
                          setSelectedSessions([...selectedSessions, session.sessionId || session.id]);
                        }
                      }}
                    >
                      {selectedSessions.includes(session.sessionId || session.id) ? (
                        <>
                          <FaCheckCircle />
                          Selected
                        </>
                      ) : (
                        <>
                          <FaPlus />
                          Compare
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/start-interview')}
          >
            <FaRocket />
            Start New Interview
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => navigate('/practice')}
          >
            <FaMicrophone />
            Practice Mode
          </button>
          
          <button 
            className="action-btn tertiary"
            onClick={() => navigate('/dashboard')}
          >
            <FaHistory />
            View History
          </button>
        </div>
      </div>

      {/* Enhanced Detailed Feedback Modal */}
      {showDetailedFeedback && (
        <div className="feedback-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Detailed Feedback Analysis</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDetailedFeedback(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {showDetailedFeedback.feedback && (
                <div className="detailed-feedback">
                  <div className="feedback-overview">
                    <div className="feedback-score-card">
                      <h4>Overall Performance</h4>
                      <div className="score-display">
                        <span className="main-score">{showDetailedFeedback.overallScore || showDetailedFeedback.score}/10</span>
                        <div className="score-breakdown">
                          <div className="score-item">
                            <span>Technical: {showDetailedFeedback.technicalScore || 'N/A'}/10</span>
                          </div>
                          <div className="score-item">
                            <span>Communication: {showDetailedFeedback.communicationScore || 'N/A'}/10</span>
                          </div>
                          <div className="score-item">
                            <span>Confidence: {showDetailedFeedback.confidenceScore || 'N/A'}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {showDetailedFeedback.feedback.strengths && (
                    <div className="feedback-section">
                      <h4>
                        <FaCheckCircle className="section-icon" />
                        Strengths
                      </h4>
                      <ul>
                        {showDetailedFeedback.feedback.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {showDetailedFeedback.feedback.improvements && (
                    <div className="feedback-section">
                      <h4>
                        <FaExclamationTriangle className="section-icon" />
                        Areas for Improvement
                      </h4>
                      <ul>
                        {showDetailedFeedback.feedback.improvements.map((improvement, index) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {showDetailedFeedback.feedback.detailedAnalysis && (
                    <div className="feedback-section">
                      <h4>
                        <FaBrain className="section-icon" />
                        Detailed Analysis
                      </h4>
                      <div className="detailed-analysis-grid">
                        {Object.entries(showDetailedFeedback.feedback.detailedAnalysis).map(([category, data]) => (
                          <div key={category} className="analysis-item">
                            <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                            <div className="analysis-score">{data.score}/10</div>
                            <p>{data.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {showDetailedFeedback.feedback.suggestions && (
                    <div className="feedback-section">
                      <h4>
                        <FaLightbulb className="section-icon" />
                        Recommendations
                      </h4>
                      <p>{showDetailedFeedback.feedback.suggestions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="feedback-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Goal</h3>
              <button 
                className="close-btn"
                onClick={() => setShowGoalModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="goal-form">
                <div className="form-group">
                  <label>Goal Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Improve Technical Score"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Target Value</label>
                  <input
                    type="number"
                    placeholder="e.g., 8.5"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowGoalModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={addGoal}
                  >
                    Add Goal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage; 
