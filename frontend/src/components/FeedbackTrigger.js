import React from 'react';
import { FaBrain, FaChartLine, FaRocket } from 'react-icons/fa';
import { useFeedback } from '../contexts/FeedbackContext';

const FeedbackTrigger = ({ 
  feedbackData = null, 
  sessionMode = 'hr', 
  role = 'Software Engineer',
  variant = 'primary' 
}) => {
  const { openEnhancedFeedback } = useFeedback();

  const handleOpenFeedback = () => {
    openEnhancedFeedback(feedbackData, sessionMode, role);
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          background: 'rgba(192, 132, 252, 0.1)',
          color: '#c084fc',
          border: '1px solid rgba(192, 132, 252, 0.3)'
        };
      case 'success':
        return {
          background: 'rgba(76, 175, 80, 0.1)',
          color: '#4CAF50',
          border: '1px solid rgba(76, 175, 80, 0.3)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none'
        };
    }
  };

  return (
    <button
      onClick={handleOpenFeedback}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        ...getButtonStyle()
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }}
    >
      <FaBrain />
      View AI Analysis
    </button>
  );
};

export default FeedbackTrigger; 