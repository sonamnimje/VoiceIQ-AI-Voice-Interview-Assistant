import React, { useState, useEffect } from 'react';
import { 
  FaBrain, 
  FaHeart, 
  FaUsers, 
  FaLightbulb, 
  FaChartLine, 
  FaTrophy, 
  FaRocket, 
  FaBullseye,
  FaStar,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaShare,
  FaPlay,
  FaPause
} from 'react-icons/fa';
import config from '../config';
import './EnhancedFeedback.css';

const EnhancedFeedback = ({ 
  feedbackData, 
  onClose, 
  showDetailed = false,
  sessionMode = 'hr',
  role = 'Software Engineer'
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaEye },
    { id: 'metrics', label: 'Detailed Metrics', icon: FaChartLine },
    { id: 'insights', label: 'AI Insights', icon: FaBrain },
    { id: 'recommendations', label: 'Recommendations', icon: FaLightbulb },
    { id: 'comparison', label: 'Performance Trends', icon: FaRocket }
  ];

  const metricCategories = [
    {
      id: 'communication',
      title: 'Communication',
      icon: FaUsers,
      color: '#4CAF50',
      metrics: ['communication_clarity', 'confidence_level', 'relevance']
    },
    {
      id: 'technical',
      title: 'Technical Skills',
      icon: FaBrain,
      color: '#2196F3',
      metrics: ['technical_depth', 'problem_solving', 'specificity']
    },
    {
      id: 'emotional',
      title: 'Emotional Intelligence',
      icon: FaHeart,
      color: '#FF9800',
      metrics: ['emotional_intelligence', 'cultural_fit', 'stress_management']
    },
    {
      id: 'leadership',
      title: 'Leadership & Innovation',
      icon: FaTrophy,
      color: '#9C27B0',
      metrics: ['leadership_potential', 'innovation_creativity', 'adaptability']
    }
  ];

  const getMetricColor = (score) => {
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#FF9800';
    return '#F44336';
  };

  const getMetricIcon = (score) => {
    if (score >= 8) return <FaCheckCircle className="metric-icon success" />;
    if (score >= 6) return <FaExclamationTriangle className="metric-icon warning" />;
    return <FaExclamationTriangle className="metric-icon error" />;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <FaArrowUp className="trend-icon improving" />;
      case 'declining': return <FaArrowDown className="trend-icon declining" />;
      default: return <FaMinus className="trend-icon stable" />;
    }
  };

  const generateAIInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/feedback/enhanced-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: feedbackData.question,
          response: feedbackData.response,
          mode: sessionMode,
          role: role,
          context: feedbackData.context
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.analysis);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights' && !aiInsights) {
      generateAIInsights();
    }
  }, [activeTab]);

  const renderOverview = () => (
    <div className="feedback-overview">
      <div className="overview-header">
        <h2>Performance Overview</h2>
        <div className="overall-score">
          <div className="score-circle" style={{ 
            background: `conic-gradient(${getMetricColor(feedbackData.overall_score)} ${feedbackData.overall_score * 36}deg, #f0f0f0 0deg)` 
          }}>
            <span>{feedbackData.overall_score.toFixed(1)}</span>
          </div>
          <p>Overall Score</p>
        </div>
      </div>

      <div className="quick-metrics">
        {metricCategories.map(category => {
          const avgScore = category.metrics.reduce((sum, metric) => 
            sum + (feedbackData[metric] || 0), 0) / category.metrics.length;
          
          return (
            <div key={category.id} className="quick-metric" style={{ borderColor: category.color }}>
              <category.icon className="metric-category-icon" style={{ color: category.color }} />
              <div className="metric-info">
                <h4>{category.title}</h4>
                <span className="metric-score">{avgScore.toFixed(1)}/10</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="performance-summary">
        <h3>Performance Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <FaStar className="summary-icon" />
            <div>
              <h4>Strengths</h4>
              <ul>
                {feedbackData.strengths?.slice(0, 3).map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="summary-item">
            <FaBullseye className="summary-icon" />
            <div>
              <h4>Areas for Improvement</h4>
              <ul>
                {feedbackData.improvements?.slice(0, 3).map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailedMetrics = () => (
    <div className="detailed-metrics">
      <div className="metrics-header">
        <h2>Detailed Performance Metrics</h2>
        <button 
          className="toggle-metrics-btn"
          onClick={() => setShowAllMetrics(!showAllMetrics)}
        >
          {showAllMetrics ? <FaEyeSlash /> : <FaEye />}
          {showAllMetrics ? 'Hide' : 'Show'} All Metrics
        </button>
      </div>

      {metricCategories.map(category => (
        <div key={category.id} className="metric-category">
          <h3 style={{ color: category.color }}>
            <category.icon /> {category.title}
          </h3>
          <div className="metrics-grid">
            {category.metrics.map(metric => {
              const score = feedbackData[metric] || 0;
              return (
                <div key={metric} className="metric-item">
                  <div className="metric-header">
                    <span className="metric-name">{metric.replace(/_/g, ' ').toUpperCase()}</span>
                    {getMetricIcon(score)}
                  </div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ 
                        width: `${score * 10}%`, 
                        backgroundColor: getMetricColor(score) 
                      }}
                    />
                  </div>
                  <span className="metric-value">{score.toFixed(1)}/10</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showAllMetrics && (
        <div className="additional-metrics">
          <h3>Additional Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>Keywords Identified</h4>
              <div className="keywords-list">
                {feedbackData.keywords_found?.map((keyword, index) => (
                  <span key={index} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>
            <div className="insight-card">
              <h4>Response Quality</h4>
              <div className="quality-indicators">
                <div className="quality-item">
                  <span>Relevance:</span>
                  <span className="quality-score">{feedbackData.relevance?.toFixed(1)}/10</span>
                </div>
                <div className="quality-item">
                  <span>Specificity:</span>
                  <span className="quality-score">{feedbackData.specificity?.toFixed(1)}/10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAIInsights = () => (
    <div className="ai-insights">
      <div className="insights-header">
        <h2>AI-Powered Insights</h2>
        {isGeneratingInsights && (
          <div className="loading-insights">
            <FaPlay className="loading-icon" />
            Generating insights...
          </div>
        )}
      </div>

      {aiInsights ? (
        <div className="insights-content">
          <div className="insight-section">
            <h3>Combined Analysis</h3>
            <div className="analysis-comparison">
              <div className="analysis-card">
                <h4>Rule-Based Evaluation</h4>
                <div className="score-display">
                  {aiInsights.rule_based_evaluation?.score?.toFixed(1)}/100
                </div>
              </div>
              <div className="analysis-card">
                <h4>AI Analysis</h4>
                <div className="score-display">
                  {aiInsights.llm_analysis?.score?.toFixed(1)}/10
                </div>
              </div>
            </div>
          </div>

          <div className="insight-section">
            <h3>Performance Insights</h3>
            <div className="performance-insights">
              <div className="insight-item">
                <h4>Strengths</h4>
                <ul>
                  {aiInsights.performance_insights?.strengths?.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div className="insight-item">
                <h4>Improvements</h4>
                <ul>
                  {aiInsights.performance_insights?.improvements?.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="insight-section">
            <h3>Recommendations</h3>
            <div className="recommendations-grid">
              <div className="recommendation-card">
                <h4>Immediate Actions</h4>
                <ul>
                  {aiInsights.recommendations?.immediate_actions?.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
              <div className="recommendation-card">
                <h4>Long-term Development</h4>
                <ul>
                  {aiInsights.recommendations?.long_term_development?.map((dev, index) => (
                    <li key={index}>{dev}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-insights">
          <p>Click to generate AI-powered insights for this response.</p>
          <button 
            className="generate-insights-btn"
            onClick={generateAIInsights}
            disabled={isGeneratingInsights}
          >
            {isGeneratingInsights ? 'Generating...' : 'Generate Insights'}
          </button>
        </div>
      )}
    </div>
  );

  const renderRecommendations = () => (
    <div className="recommendations">
      <h2>Personalized Recommendations</h2>
      
      <div className="recommendations-grid">
        <div className="recommendation-section">
          <h3>Practice Focus Areas</h3>
          <div className="focus-areas">
            {feedbackData.improvements?.map((improvement, index) => (
              <div key={index} className="focus-area">
                <FaBullseye className="focus-icon" />
                <span>{improvement}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="recommendation-section">
          <h3>Next Steps</h3>
          <div className="next-steps">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Review Similar Questions</h4>
                <p>Practice more {sessionMode} interview questions to build confidence</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Record Your Responses</h4>
                <p>Record and analyze your responses to identify patterns</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Seek Feedback</h4>
                <p>Get feedback from mentors or peers on your responses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceTrends = () => (
    <div className="performance-trends">
      <h2>Performance Trends</h2>
      
      <div className="trends-grid">
        <div className="trend-card">
          <h3>Consistency Score</h3>
          <div className="trend-value">
            {feedbackData.consistency_score?.toFixed(1) || 'N/A'}/10
          </div>
          <p>How consistent your performance was across responses</p>
        </div>

        <div className="trend-card">
          <h3>Improvement Trend</h3>
          <div className="trend-indicator">
            {getTrendIcon(feedbackData.improvement_trend || 'stable')}
            <span>{feedbackData.improvement_trend || 'stable'}</span>
          </div>
          <p>Your performance trend throughout the session</p>
        </div>

        <div className="trend-card">
          <h3>Strongest Areas</h3>
          <div className="strengths-list">
            {feedbackData.strongest_areas?.map((area, index) => (
              <span key={index} className="strength-tag">{area}</span>
            ))}
          </div>
        </div>

        <div className="trend-card">
          <h3>Areas for Growth</h3>
          <div className="weaknesses-list">
            {feedbackData.weakest_areas?.map((area, index) => (
              <span key={index} className="weakness-tag">{area}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="enhanced-feedback-modal">
      <div className="feedback-header">
        <h1>Enhanced Performance Analysis</h1>
        <div className="header-actions">
          <button className="action-btn">
            <FaDownload /> Export
          </button>
          <button className="action-btn">
            <FaShare /> Share
          </button>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      <div className="feedback-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="feedback-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'metrics' && renderDetailedMetrics()}
        {activeTab === 'insights' && renderAIInsights()}
        {activeTab === 'recommendations' && renderRecommendations()}
        {activeTab === 'comparison' && renderPerformanceTrends()}
      </div>
    </div>
  );
};

export default EnhancedFeedback; 