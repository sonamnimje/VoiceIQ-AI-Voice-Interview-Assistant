import React, { useEffect, useState } from 'react';
import '../components/ModernUI.css';
import './DashboardPage.css';
import Centerpiece from '../components/Centerpiece';
import ModernPopup from '../components/ModernPopup';
import { showToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import TimeBasedGreeting from '../components/TimeBasedGreeting';
import config from '../config';
import { 
  FaPlay, 
  FaFileAlt, 
  FaBrain, 
  FaBullseye, 
  FaChartLine, 
  FaTrophy, 
  FaCalendarAlt, 
  FaClock,
  FaArrowRight,
  FaStar,
  FaUsers,
  FaMicrophone,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaRocket,
  FaMedal,
  FaHourglassHalf,
  FaChartBar,
  FaUserTie,
  FaGraduationCap,
  FaUser
} from 'react-icons/fa';

const DashboardPage = () => {
  const [userName, setUserName] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    avgOverallScore: 0,
    avgTechnicalScore: 0,
    avgCommunicationScore: 0,
    avgProblemSolvingScore: 0,
    avgConfidenceScore: 0,
    totalTimeSpent: 0,
    lastInterviewDate: null,
    bestScore: 0,
    improvementTrend: null
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceInsights, setPerformanceInsights] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const email = localStorage.getItem('user_email') || 'user@email.com';
    loadDashboardData(email);
    
    // Check if user just completed an interview
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('interview_completed') === 'true') {
      showToast('Interview completed successfully! Great job! 🎉', 'success');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadDashboardData = async (email) => {
    try {
      // Load enhanced dashboard stats
      const statsResponse = await fetch(`${config.BACKEND_URL}/api/dashboard/stats/${encodeURIComponent(email)}`);
      const statsData = await statsResponse.json();
      
      if (statsData.success && statsData.stats) {
        setDashboardStats(statsData.stats);
      }

      // Load recent interview history
      const historyResponse = await fetch(`${config.BACKEND_URL}/api/interview/history/${encodeURIComponent(email)}?limit=5`);
      const historyData = await historyResponse.json();
      
      if (historyData.success && historyData.history) {
        setRecentActivity(historyData.history);
      }

      // Load user profile for name
      const profileResponse = await fetch(`${config.BACKEND_URL}/api/profile?email=${encodeURIComponent(email)}`);
      const profileData = await profileResponse.json();
      
      if (profileData.name) {
        setUserName(profileData.name);
      }

      // Generate performance insights from stats
      generatePerformanceInsights(statsData.stats || {});
      
      // Generate achievements
      generateAchievements(statsData.stats || {});

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setIsLoading(false);
    }
  };

  const generatePerformanceInsights = (stats) => {
    const insights = [
      {
        label: 'Communication Skills',
        score: stats.avgCommunicationScore || 0,
        icon: FaUserTie,
        color: '#c084fc'
      },
      {
        label: 'Technical Knowledge',
        score: stats.avgTechnicalScore || 0,
        icon: FaBrain,
        color: '#6ee7b7'
      },
      {
        label: 'Problem Solving',
        score: stats.avgProblemSolvingScore || 0,
        icon: FaBullseye,
        color: '#60a5fa'
      },
      {
        label: 'Confidence Level',
        score: stats.avgConfidenceScore || 0,
        icon: FaRocket,
        color: '#fbbf24'
      }
    ];
    setPerformanceInsights(insights);
  };

  const generateAchievements = (stats) => {
    const achievements = [];
    
    if (stats.completedInterviews >= 1) {
      achievements.push({
        title: 'First Interview',
        description: 'Completed your first AI interview',
        icon: '��',
        unlocked: true,
        date: stats.lastInterviewDate
      });
    }
    
    if (stats.avgOverallScore >= 80) {
      achievements.push({
        title: 'High Performer',
        description: 'Achieved 80%+ average score',
        icon: '🏆',
        unlocked: true,
        date: stats.lastInterviewDate
      });
    }
    
    if (stats.completedInterviews >= 5) {
      achievements.push({
        title: 'Interview Veteran',
        description: 'Completed 5+ interviews',
        icon: '⭐',
        unlocked: true,
        date: stats.lastInterviewDate
      });
    }
    
    if (stats.completedInterviews >= 10) {
      achievements.push({
        title: 'Interview Master',
        description: 'Completed 10+ interviews',
        icon: '👑',
        unlocked: stats.completedInterviews >= 10,
        date: stats.lastInterviewDate
      });
    }
    
    if (stats.avgOverallScore >= 90) {
      achievements.push({
        title: 'Excellence',
        description: 'Maintain 90%+ average score',
        icon: '💎',
        unlocked: stats.avgOverallScore >= 90,
        date: stats.lastInterviewDate
      });
    }
    
    setAchievements(achievements);
  };

  const navigate = useNavigate();

  const handleActionClick = (action) => {
    setPopupConfig({
      title: 'Action Confirmation',
      message: `You selected: ${action}`,
      type: 'info'
    });
    setShowPopup(true);
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'No interviews yet';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = (activity) => {
    switch (activity.type) {
      case 'interview_completed':
        return <FaCheckCircle />;
      case 'feedback_generated':
        return <FaBrain />;
      case 'score_improved':
        return <FaArrowUp />;
      default:
        return <FaFileAlt />;
    }
  };

  const getActivityStatus = (activity) => {
    switch (activity.type) {
      case 'interview_completed':
        return 'completed';
      case 'feedback_generated':
        return 'pending';
      case 'score_improved':
        return 'success';
      default:
        return 'completed';
    }
  };

  const getImprovementTrend = () => {
    if (!dashboardStats.improvementTrend) return { value: 0, direction: 'neutral' };
    return {
      value: Math.abs(dashboardStats.improvementTrend),
      direction: dashboardStats.improvementTrend > 0 ? 'up' : 'down'
    };
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const trend = getImprovementTrend();

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="greeting-text">
              <TimeBasedGreeting userName={userName} className="user-name" useTextWave={true} showEmoji={false} />
            </h1>
            <p className="welcome-subtitle">
              Ready to ace your next interview? Let's get started!
            </p>
          </div>
          <div className="header-actions">
            <button className="quick-action-btn" onClick={() => navigate('/start-interview')}>
              <FaPlay className="btn-icon" />
              Start Interview
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {/* Stats Overview Cards */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <FaMicrophone />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{dashboardStats.completedInterviews}</h3>
              <p className="stat-label">Interviews Completed</p>
            </div>
            <div className="stat-progress">
              <div className="progress-bar" style={{ width: `${Math.min(dashboardStats.completedInterviews * 10, 100)}%` }}></div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <FaStar />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{dashboardStats.avgOverallScore.toFixed(1)}</h3>
              <p className="stat-label">Average Score</p>
            </div>
            <div className="stat-progress">
              <div className="progress-bar" style={{ width: `${dashboardStats.avgOverallScore}%` }}></div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{formatDate(dashboardStats.lastInterviewDate)}</h3>
              <p className="stat-label">Last Interview</p>
            </div>
            <div className="stat-progress">
              <div className="progress-bar" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              {trend.direction === 'up' ? <FaArrowUp /> : <FaArrowDown />}
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{trend.direction === 'up' ? '+' : '-'}{trend.value}%</h3>
              <p className="stat-label">Improvement</p>
            </div>
            <div className="stat-progress">
              <div className="progress-bar" style={{ width: `${Math.min(trend.value * 2, 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Left Column */}
          <div className="left-column">
            {/* Recent Activity */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Recent Activity</h2>
                <button className="view-all-btn" onClick={() => navigate('/start-interview')}>Start Interview</button>
              </div>
              <div className="activity-list">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className={`activity-icon ${getActivityStatus(activity)}`}>
                        {getActivityIcon(activity)}
                      </div>
                      <div className="activity-content">
                        <h4>{activity.title || 'Interview Session'}</h4>
                        <p>{activity.description || `Interview completed with ${activity.score || 0}% score`}</p>
                        <span className="activity-time">{formatTimeAgo(activity.created_at)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <FaMicrophone className="empty-icon" />
                    <p>No recent activity. Start your first interview!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Achievements</h2>
                <span className="achievement-count">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
              </div>
              <div className="achievements-grid">
                {achievements.map((achievement, index) => (
                  <div key={index} className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="achievement-icon">
                      {achievement.icon}
                    </div>
                    <div className="achievement-content">
                      <h4>{achievement.title}</h4>
                      <p>{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Quick Actions */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Quick Actions</h2>
              </div>
              <div className="actions-grid">
                <button 
                  className="action-card primary"
                  onClick={() => {
                    handleActionClick('Start New Interview');
                    navigate('/start-interview');
                  }}
                >
                  <FaPlay className="action-icon" />
                  <span>Start Interview</span>
                  <FaArrowRight className="arrow-icon" />
                </button>
                
                <button 
                  className="action-card secondary"
                  onClick={() => {
                    handleActionClick('Practice Mode');
                    navigate('/practice');
                  }}
                >
                  <FaMicrophone className="action-icon" />
                  <span>Practice Mode</span>
                  <FaArrowRight className="arrow-icon" />
                </button>
                
                <button 
                  className="action-card tertiary"
                  onClick={() => {
                    handleActionClick('Profile Settings');
                    navigate('/profile');
                  }}
                >
                  <FaUser className="action-icon" />
                  <span>Profile Settings</span>
                  <FaArrowRight className="arrow-icon" />
                </button>
                
                <button 
                  className="action-card quaternary"
                  onClick={() => {
                    handleActionClick('Practice Mode');
                    navigate('/practice');
                  }}
                >
                  <FaBullseye className="action-icon" />
                  <span>Practice Mode</span>
                  <FaArrowRight className="arrow-icon" />
                </button>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Performance Insights</h2>
                <FaChartBar className="header-icon" />
              </div>
              <div className="insights-content">
                {performanceInsights.map((insight, index) => {
                  const IconComponent = insight.icon;
                  return (
                    <div key={index} className="insight-item">
                      <div className="insight-header">
                        <div className="insight-label-group">
                          <IconComponent className="insight-icon" style={{ color: insight.color }} />
                          <span className="insight-label">{insight.label}</span>
                        </div>
                        <span className="insight-score">{insight.score.toFixed(0)}%</span>
                      </div>
                      <div className="insight-bar">
                        <div 
                          className="insight-progress" 
                          style={{ 
                            width: `${insight.score}%`,
                            background: `linear-gradient(90deg, ${insight.color} 0%, ${insight.color}80 100%)`
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          <div className="content-card full-width">
            <div className="card-header">
              <h2 className="card-title">Your Progress Journey</h2>
              <div className="header-actions">
                <button className="save-stats-btn" onClick={() => showToast('Progress saved!', 'success')}>
                  <FaChartLine />
                  Save Progress
                </button>
              </div>
            </div>
            <div className="progress-journey">
              {achievements.slice(0, 4).map((achievement, index) => (
                <div key={index} className={`journey-step ${achievement.unlocked ? 'completed' : index === achievements.filter(a => a.unlocked).length ? 'active' : ''}`}>
                  <div className="step-icon">
                    {achievement.unlocked ? '✓' : achievement.icon}
                  </div>
                  <div className="step-content">
                    <h4>{achievement.title}</h4>
                    <p>{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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

export default DashboardPage;