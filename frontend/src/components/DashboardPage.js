import React, { useEffect, useState } from 'react';
import './ModernUI.css';

import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  // These values would typically come from props or API calls
  const [userName, setUserName] = useState('');
  const interviewsCompleted = 8;
  const avgFeedbackScore = 4.7;
  const lastInterviewDate = "2025-07-20";

  useEffect(() => {
    // Fetch user name from backend (replace with actual user id/email logic as needed)
    fetch('http://localhost:8000/get_user?email=user@email.com')
      .then(res => res.json())
      .then(data => {
        if (data.name) setUserName(data.name);
      })
      .catch(() => setUserName('User'));
  }, []);

  const navigate = useNavigate();

  // Function to save dashboard stats to backend
  const saveStats = () => {
    fetch('http://localhost:8000/save_dashboard_stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userName,
        interviewsCompleted,
        avgFeedbackScore,
        lastInterviewDate,
        email: 'user@email.com', // Replace with actual user email logic
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Stats saved successfully!');
        } else {
          alert('Failed to save stats.');
        }
      })
      .catch(() => alert('Error saving stats.'));
  };

  return (
    <div className="modern-bg">
      <div className="glass-card" style={{ maxWidth: 600, width: '100%' }}>
        {/* Welcome Banner */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: 0 }}>
            Welcome <span style={{ color: '#c084fc' }}>{userName}</span> <span role="img" aria-label="wave">👋</span>
          </h2>
          <p style={{ color: '#c084fc', fontSize: '1.1rem', marginTop: 8 }}>
            Welcome back to your Dashboard!
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
          <div style={{ flex: 1, background: 'rgba(192,132,252,0.12)', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{interviewsCompleted}</div>
            <div style={{ color: '#a3a3a3' }}>Interviews Completed</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(110,231,183,0.12)', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{avgFeedbackScore}</div>
            <div style={{ color: '#a3a3a3' }}>Avg Feedback Score</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(96,165,250,0.12)', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{lastInterviewDate}</div>
            <div style={{ color: '#a3a3a3' }}>Last Interview Date</div>
          </div>
        </div>

        {/* Action Cards */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <button className="modern-btn" style={{ flex: 1 }} onClick={() => navigate('/interview')}>
            🟢 Start New Interview
          </button>
          <button className="modern-btn" style={{ flex: 1 }} onClick={() => navigate('/transcripts')}>
            📜 View Transcripts
          </button>
          <button className="modern-btn" style={{ flex: 1 }} onClick={() => navigate('/feedback')}>
            🧠 View AI Feedback
          </button>
        </div>

        {/* Save Stats Button */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button className="modern-btn" onClick={saveStats}>
            💾 Save Stats
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;