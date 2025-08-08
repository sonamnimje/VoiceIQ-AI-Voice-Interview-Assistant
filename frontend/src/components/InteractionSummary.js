import React from 'react';

const InteractionSummary = ({ interactions, sessionInfo }) => {
  // Ensure interactions is always an array
  const safeInteractions = Array.isArray(interactions) ? interactions : [];
  
  if (!safeInteractions || safeInteractions.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        color: '#aaa',
        background: 'rgba(34,34,68,0.6)',
        borderRadius: 12,
        border: '1px solid rgba(192,132,252,0.2)'
      }}>
        No interaction data available
      </div>
    );
  }

  // Calculate interaction metrics
  const totalInteractions = safeInteractions.length;
  const userInteractions = safeInteractions.filter(i => i.speaker === 'user').length;
  const aiInteractions = safeInteractions.filter(i => i.speaker === 'ai').length;
  const voiceInteractions = safeInteractions.filter(i => i.interactionType === 'voice-answer').length;
  const textInteractions = safeInteractions.filter(i => i.interactionType === 'text-answer').length;
  
  // Calculate average response time (if available)
  const responseTimes = safeInteractions
    .filter(i => i.responseTime)
    .map(i => i.responseTime);
  const avgResponseTime = responseTimes.length > 0 
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
    : 'N/A';

  // Calculate confidence trends
  const confidenceScores = safeInteractions
    .filter(i => i.confidence)
    .map(i => i.confidence);
  const avgConfidence = confidenceScores.length > 0
    ? (confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length * 100).toFixed(1)
    : 'N/A';

  // Interaction patterns
  const interactionPatterns = {
    'voice-answer': '🎤 Voice Responses',
    'text-answer': '⌨️ Text Responses',
    'question': '🤖 AI Questions',
    'feedback': '💬 AI Feedback'
  };

  const patternCounts = {};
  safeInteractions.forEach(i => {
    if (i.interactionType) {
      patternCounts[i.interactionType] = (patternCounts[i.interactionType] || 0) + 1;
    }
  });

  return (
    <div style={{ 
      background: 'rgba(34,34,68,0.85)', 
      borderRadius: 16, 
      padding: '24px',
      border: '1px solid rgba(192,132,252,0.2)',
      marginBottom: '24px'
    }}>
      <h3 style={{ 
        color: '#c084fc', 
        fontWeight: 700, 
        marginBottom: '20px',
        fontSize: '1.3rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📊 Interaction Summary
      </h3>

      {/* Key Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '16px', 
          background: 'rgba(192,132,252,0.1)', 
          borderRadius: 12,
          border: '1px solid rgba(192,132,252,0.3)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#c084fc' }}>
            {totalInteractions}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#ccc' }}>Total Interactions</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '16px', 
          background: 'rgba(110,231,183,0.1)', 
          borderRadius: 12,
          border: '1px solid rgba(110,231,183,0.3)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6ee7b7' }}>
            {userInteractions}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#ccc' }}>Your Responses</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '16px', 
          background: 'rgba(251,191,36,0.1)', 
          borderRadius: 12,
          border: '1px solid rgba(251,191,36,0.3)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24' }}>
            {aiInteractions}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#ccc' }}>AI Questions</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '16px', 
          background: 'rgba(248,113,113,0.1)', 
          borderRadius: 12,
          border: '1px solid rgba(248,113,113,0.3)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f87171' }}>
            {sessionInfo?.duration || 'N/A'}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#ccc' }}>Session Duration</div>
        </div>
      </div>

      {/* Interaction Patterns */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem' }}>
          🎯 Interaction Patterns
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px'
        }}>
          {Object.entries(patternCounts || {}).map(([type, count]) => (
            <div key={type} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ color: '#fff', fontSize: '0.9rem' }}>
                {interactionPatterns[type] || type}
              </span>
              <span style={{ 
                color: '#c084fc', 
                fontWeight: 600, 
                fontSize: '1.1rem'
              }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem' }}>
          📈 Performance Metrics
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px'
        }}>
          <div style={{ 
            padding: '16px',
            background: 'rgba(110,231,183,0.1)',
            borderRadius: 12,
            border: '1px solid rgba(110,231,183,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6ee7b7' }}>
              {voiceInteractions}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '4px' }}>
              Voice Responses
            </div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
              {userInteractions > 0 ? ((voiceInteractions / userInteractions) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
          
          <div style={{ 
            padding: '16px',
            background: 'rgba(192,132,252,0.1)',
            borderRadius: 12,
            border: '1px solid rgba(192,132,252,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c084fc' }}>
              {textInteractions}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '4px' }}>
              Text Responses
            </div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
              {userInteractions > 0 ? ((textInteractions / userInteractions) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
          
          <div style={{ 
            padding: '16px',
            background: 'rgba(251,191,36,0.1)',
            borderRadius: 12,
            border: '1px solid rgba(251,191,36,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24' }}>
              {avgResponseTime}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '4px' }}>
              Avg Response Time
            </div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
              {avgResponseTime !== 'N/A' ? 'seconds' : 'Not available'}
            </div>
          </div>
          
          <div style={{ 
            padding: '16px',
            background: 'rgba(248,113,113,0.1)',
            borderRadius: 12,
            border: '1px solid rgba(248,113,113,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171' }}>
              {avgConfidence}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '4px' }}>
              Avg Confidence
            </div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
              {avgConfidence !== 'N/A' ? '%' : 'Not available'}
            </div>
          </div>
        </div>
      </div>

      {/* Session Information */}
      {sessionInfo && (
        <div style={{ 
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h4 style={{ color: '#fff', marginBottom: '12px', fontSize: '1rem' }}>
            📋 Session Information
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '12px',
            fontSize: '0.9rem'
          }}>
            <div>
              <span style={{ color: '#aaa' }}>Role: </span>
              <span style={{ color: '#fff' }}>{sessionInfo.role || 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: '#aaa' }}>Date: </span>
              <span style={{ color: '#fff' }}>{sessionInfo.date || 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: '#aaa' }}>Duration: </span>
              <span style={{ color: '#fff' }}>{sessionInfo.duration || 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: '#aaa' }}>Questions: </span>
              <span style={{ color: '#fff' }}>{sessionInfo.totalQuestions || totalInteractions}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionSummary; 