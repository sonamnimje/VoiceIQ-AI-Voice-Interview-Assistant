import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';

const InteractionAnalytics = ({ interactionData, sessionData }) => {
  if (!interactionData) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: '#aaa',
        background: 'rgba(34,34,68,0.6)',
        borderRadius: 12,
        border: '1px solid rgba(192,132,252,0.2)'
      }}>
        No interaction data available
      </div>
    );
  }

  // Prepare data for charts
  const interactionTypes = {
    'voice-answer': 0,
    'text-answer': 0,
    'question': 0,
    'feedback': 0
  };

  const timeData = [];
  const confidenceScores = [];
  const responseTimes = [];

  interactionData.forEach((interaction, index) => {
    // Count interaction types
    if (interaction.interactionType) {
      interactionTypes[interaction.interactionType] = (interactionTypes[interaction.interactionType] || 0) + 1;
    }

    // Time series data
    if (interaction.timestamp) {
      const time = new Date(interaction.timestamp);
      timeData.push({
        x: time,
        y: index + 1
      });
    }

    // Confidence scores (if available)
    if (interaction.confidence) {
      confidenceScores.push(interaction.confidence);
    }

    // Response times (if available)
    if (interaction.responseTime) {
      responseTimes.push(interaction.responseTime);
    }
  });

  // Chart configurations
  const interactionTypeChartData = {
    labels: Object.keys(interactionTypes).map(type => 
      type === 'voice-answer' ? 'Voice Responses' :
      type === 'text-answer' ? 'Text Responses' :
      type === 'question' ? 'AI Questions' :
      type === 'feedback' ? 'AI Feedback' : type
    ),
    datasets: [{
      data: Object.values(interactionTypes),
      backgroundColor: [
        'rgba(110,231,183,0.8)',
        'rgba(192,132,252,0.8)',
        'rgba(251,191,36,0.8)',
        'rgba(248,113,113,0.8)'
      ],
      borderColor: [
        'rgba(110,231,183,1)',
        'rgba(192,132,252,1)',
        'rgba(251,191,36,1)',
        'rgba(248,113,113,1)'
      ],
      borderWidth: 2
    }]
  };

  const timeSeriesChartData = {
    labels: timeData.map((_, index) => `Interaction ${index + 1}`),
    datasets: [{
      label: 'Interaction Timeline',
      data: timeData.map((_, index) => index + 1),
      borderColor: 'rgba(192,132,252,1)',
      backgroundColor: 'rgba(192,132,252,0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const confidenceChartData = {
    labels: confidenceScores.map((_, i) => `Response ${i + 1}`),
    datasets: [{
      label: 'Confidence Score',
      data: confidenceScores,
      borderColor: 'rgba(110,231,183,1)',
      backgroundColor: 'rgba(110,231,183,0.2)',
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#fff'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };

  const timeSeriesOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };

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
        fontSize: '1.3rem'
      }}>
        📊 Interaction Analytics
      </h3>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
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
            {interactionData.length}
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
            {interactionTypes['voice-answer'] + interactionTypes['text-answer']}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#ccc' }}>User Responses</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '16px', 
          background: 'rgba(251,191,36,0.1)', 
          borderRadius: 12,
          border: '1px solid rgba(251,191,36,0.3)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24' }}>
            {interactionTypes['question']}
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
            {sessionData?.duration || 'N/A'}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#ccc' }}>Session Duration</div>
        </div>
      </div>

      {/* Charts Grid */}
      {interactionData.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px'
        }}>
        {/* Interaction Types Chart */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: 12, 
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem' }}>
            🎯 Interaction Types Distribution
          </h4>
          <div style={{ height: '250px' }}>
            <Doughnut 
              data={interactionTypeChartData} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'bottom',
                    labels: { color: '#fff' }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Time Series Chart */}
        {timeData.length > 0 && (
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 12, 
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem' }}>
              ⏱️ Interaction Timeline
            </h4>
            <div style={{ height: '250px' }}>
              <Line data={timeSeriesChartData} options={timeSeriesOptions} />
            </div>
          </div>
        )}

        {/* Confidence Scores Chart */}
        {confidenceScores.length > 0 && (
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 12, 
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem' }}>
              📈 Response Confidence
            </h4>
            <div style={{ height: '250px' }}>
              <Line data={confidenceChartData} options={chartOptions} />
            </div>
          </div>
        )}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#aaa',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          No interaction data available for charts
        </div>
      )}

      {/* Interaction Details */}
      <div style={{ marginTop: '24px' }}>
        <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem' }}>
          📝 Detailed Interaction Log
        </h4>
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {interactionData.map((interaction, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '8px 0',
              borderBottom: index < interactionData.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%',
                background: interaction.speaker === 'user' ? '#6ee7b7' : '#c084fc'
              }} />
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#aaa',
                minWidth: '80px'
              }}>
                {interaction.timestamp ? new Date(interaction.timestamp).toLocaleTimeString() : 'N/A'}
              </span>
              <span style={{ 
                fontSize: '0.9rem', 
                color: '#fff',
                fontWeight: 500
              }}>
                {interaction.speaker === 'user' ? '👤 You' : '🤖 AI'}
              </span>
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#ccc',
                fontStyle: 'italic'
              }}>
                {interaction.interactionType || 'interaction'}
              </span>
              <div style={{ 
                flex: 1,
                fontSize: '0.85rem',
                color: '#d1c4e9',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}>
                {interaction.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractionAnalytics; 