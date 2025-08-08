import React, { useState, useEffect } from 'react';
import { FaTrash, FaEye, FaChartLine, FaClock, FaStar } from 'react-icons/fa';
import { getPracticeHistory, clearPracticeHistory, formatTime } from './PracticeUtils';
import './PracticeHistory.css';

const PracticeHistory = ({ onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const history = getPracticeHistory();
    setSessions(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  const handleClearHistory = () => {
    if (clearPracticeHistory()) {
      setSessions([]);
      setShowConfirmClear(false);
    }
  };

  const getModeColor = (mode) => {
    const colors = {
      beginner: '#4ade80',
      intermediate: '#fbbf24',
      advanced: '#f87171',
      behavioral: '#a78bfa'
    };
    return colors[mode] || '#c084fc';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#fbbf24';
    return '#f87171';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedSession) {
    return (
      <div className="practice-history-container">
        <div className="history-header">
          <button className="back-button" onClick={() => setSelectedSession(null)}>
            ← Back to History
          </button>
          <h2>Practice Session Details</h2>
        </div>

        <div className="session-details">
          <div className="session-header">
            <div 
              className="mode-badge"
              style={{ backgroundColor: getModeColor(selectedSession.mode) }}
            >
              {selectedSession.mode.charAt(0).toUpperCase() + selectedSession.mode.slice(1)}
            </div>
            <div className="session-date">{formatDate(selectedSession.timestamp)}</div>
          </div>

          <div className="session-stats">
            <div className="stat-card">
              <FaClock className="stat-icon" />
              <div className="stat-content">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{selectedSession.duration}</span>
              </div>
            </div>
            <div className="stat-card">
              <FaChartLine className="stat-icon" />
              <div className="stat-content">
                <span className="stat-label">Score</span>
                <span 
                  className="stat-value"
                  style={{ color: getScoreColor(selectedSession.score) }}
                >
                  {selectedSession.score}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <FaStar className="stat-icon" />
              <div className="stat-content">
                <span className="stat-label">Questions</span>
                <span className="stat-value">{selectedSession.totalQuestions}</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📝</span>
              <div className="stat-content">
                <span className="stat-label">Avg. Length</span>
                <span className="stat-value">{selectedSession.averageAnswerLength} words</span>
              </div>
            </div>
          </div>

          <div className="session-feedback">
            <h3>Feedback</h3>
            <p>{selectedSession.feedback}</p>
          </div>

          <div className="session-tips">
            <h3>Practice Tips</h3>
            <ul>
              {selectedSession.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-history-container">
      <div className="history-header">
        <h2>Practice History</h2>
        <div className="header-actions">
          {sessions.length > 0 && (
            <button 
              className="clear-button"
              onClick={() => setShowConfirmClear(true)}
            >
              <FaTrash /> Clear History
            </button>
          )}
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Practice Sessions Yet</h3>
          <p>Start practicing to see your progress here!</p>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((session, index) => (
            <div 
              key={index}
              className="session-card"
              onClick={() => setSelectedSession(session)}
            >
              <div className="session-info">
                <div className="session-mode">
                  <div 
                    className="mode-indicator"
                    style={{ backgroundColor: getModeColor(session.mode) }}
                  ></div>
                  <span className="mode-name">
                    {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}
                  </span>
                </div>
                <div className="session-date">{formatDate(session.timestamp)}</div>
              </div>
              
              <div className="session-metrics">
                <div className="metric">
                  <FaClock className="metric-icon" />
                  <span>{session.duration}</span>
                </div>
                <div className="metric">
                  <FaChartLine className="metric-icon" />
                  <span 
                    style={{ color: getScoreColor(session.score) }}
                  >
                    {session.score}
                  </span>
                </div>
                <div className="metric">
                  <FaStar className="metric-icon" />
                  <span>{session.totalQuestions}</span>
                </div>
              </div>

              <div className="session-preview">
                <p>{session.feedback.substring(0, 100)}...</p>
              </div>

              <button className="view-details-button">
                <FaEye /> View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {showConfirmClear && (
        <div className="confirm-modal">
          <div className="confirm-content">
            <h3>Clear Practice History?</h3>
            <p>This action cannot be undone. All your practice sessions will be permanently deleted.</p>
            <div className="confirm-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowConfirmClear(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-button"
                onClick={handleClearHistory}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeHistory; 