import React, { useState, useEffect } from 'react';
import { 
  FaBrain, 
  FaChartLine, 
  FaLightbulb, 
  FaGraduationCap, 
  FaRocket, 
  FaDownload, 
  FaShareAlt, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaStar,
  FaTools,
  FaUserTie,
  FaCalendarAlt,
  FaArrowUp,
  FaPlay,
  FaPause,
  FaStop
} from 'react-icons/fa';
import config from '../config';
import { showToast } from './Toast';
import './AIAnalysisTool.css';

const AIAnalysisTool = ({ sessionData, onAnalysisComplete }) => {
  const [activeTab, setActiveTab] = useState('comprehensive');
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState({});
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [realTimeData, setRealTimeData] = useState({
    currentQuestion: '',
    currentAnswer: '',
    previousResponses: []
  });

  // Demo data for when accessed directly
  const demoSessionData = {
    session_id: 'demo-session-123',
    role: 'Frontend Developer',
    type: 'technical',
    difficulty: 'intermediate',
    duration: 45,
    responses: [
      {
        question: "Tell me about yourself and your background in software development.",
        answer: "I'm a software engineer with 3 years of experience in full-stack development, primarily working with React, Node.js, and Python. I've worked on several web applications and have experience with cloud platforms like AWS."
      },
      {
        question: "What is your experience with React hooks?",
        answer: "I've been using React hooks extensively for the past 2 years. I'm comfortable with useState, useEffect, useContext, and custom hooks. I've also worked with libraries like React Query and Redux Toolkit."
      },
      {
        question: "How do you handle state management in large applications?",
        answer: "For smaller applications, I use React's built-in state and Context API. For larger applications, I prefer Redux Toolkit or Zustand for global state management, combined with React Query for server state."
      }
    ]
  };

  // Use provided session data or fall back to demo data
  const effectiveSessionData = sessionData || demoSessionData;

  const analysisTypes = {
    comprehensive: {
      name: 'Comprehensive Analysis',
      icon: FaBrain,
      description: 'Complete post-interview analysis with detailed feedback',
      endpoint: '/api/ai/interview-analysis',
      analysisType: 'post_interview'
    },
    realTime: {
      name: 'Real-Time Feedback',
      icon: FaPlay,
      description: 'Get immediate feedback during interviews',
      endpoint: '/api/ai/real-time-feedback',
      analysisType: 'real_time'
    },
    skillAssessment: {
      name: 'Skill Gap Analysis',
      icon: FaTools,
      description: 'Identify skill gaps and create learning paths',
      endpoint: '/api/ai/skill-assessment',
      analysisType: 'skill_assessment'
    },
    careerDevelopment: {
      name: 'Career Development',
      icon: FaRocket,
      description: 'Strategic career advice and growth planning',
      endpoint: '/api/ai/career-development',
      analysisType: 'career_development'
    }
  };

  const runAnalysis = async (type) => {
    if (!effectiveSessionData || !effectiveSessionData.responses || effectiveSessionData.responses.length === 0) {
      showToast('No interview data available for analysis', 'error');
      return;
    }

    setLoading(true);
    setCurrentAnalysis(type);

    try {
      const analysisConfig = analysisTypes[type];
      const payload = {
        session_data: effectiveSessionData,
        analysis_type: analysisConfig.analysisType
      };

      const response = await fetch(`${config.BACKEND_URL}${analysisConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success === false) {
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysisResults(prev => ({
        ...prev,
        [type]: result
      }));

      showToast(`${analysisConfig.name} completed successfully!`, 'success');
      
      if (onAnalysisComplete) {
        onAnalysisComplete(type, result);
      }

    } catch (error) {
      console.error('Analysis error:', error);
      showToast(`Analysis failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setCurrentAnalysis(null);
    }
  };

  const runQuickAnalysis = async () => {
    if (!realTimeData.currentQuestion || !realTimeData.currentAnswer) {
      showToast('Please provide both question and answer for quick analysis', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        question: realTimeData.currentQuestion,
        answer: realTimeData.currentAnswer,
        role: effectiveSessionData?.role || 'Software Engineer',
        context: {
          previousResponses: realTimeData.previousResponses.length,
          sessionType: effectiveSessionData?.type || 'mixed'
        }
      };

      const response = await fetch(`${config.BACKEND_URL}/api/ai/quick-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Quick analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success === false) {
        throw new Error(result.error || 'Quick analysis failed');
      }

      setAnalysisResults(prev => ({
        ...prev,
        quickAnalysis: result
      }));

      showToast('Quick analysis completed!', 'success');

    } catch (error) {
      console.error('Quick analysis error:', error);
      showToast(`Quick analysis failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeMode = () => {
    setRealTimeMode(true);
    setActiveTab('realTime');
  };

  const stopRealTimeMode = () => {
    setRealTimeMode(false);
    setRealTimeData({
      currentQuestion: '',
      currentAnswer: '',
      previousResponses: []
    });
  };

  const addResponse = () => {
    if (realTimeData.currentQuestion && realTimeData.currentAnswer) {
      setRealTimeData(prev => ({
        ...prev,
        previousResponses: [
          ...prev.previousResponses,
          {
            question: prev.currentQuestion,
            answer: prev.currentAnswer,
            timestamp: new Date().toISOString()
          }
        ],
        currentQuestion: '',
        currentAnswer: ''
      }));
    }
  };

  const downloadAnalysis = (type) => {
    const result = analysisResults[type];
    if (!result) return;

    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-analysis-${type}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const shareAnalysis = (type) => {
    const result = analysisResults[type];
    if (!result) return;

    const summary = `AI Interview Analysis - ${analysisTypes[type]?.name}\n\n`;
    const keyPoints = [
      `Overall Score: ${result.overall_score || result.current_response_score || 'N/A'}/10`,
      `Analysis Type: ${result.analysis_type || type}`,
      `Timestamp: ${new Date(result.timestamp).toLocaleString()}`
    ].join('\n');

    const shareText = summary + keyPoints;

    if (navigator.share) {
      navigator.share({
        title: 'AI Interview Analysis',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Analysis summary copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Failed to copy analysis', 'error');
      });
    }
  };

  const renderAnalysisResults = (type) => {
    const result = analysisResults[type];
    if (!result) return null;

    const config = analysisTypes[type];

    switch (type) {
      case 'comprehensive':
        return (
          <div className="analysis-results">
            <div className="results-header">
              <h3><config.icon /> {config.name} Results</h3>
              <div className="action-buttons">
                <button onClick={() => downloadAnalysis(type)} className="action-btn">
                  <FaDownload /> Download
                </button>
                <button onClick={() => shareAnalysis(type)} className="action-btn secondary">
                  <FaShareAlt /> Share
                </button>
              </div>
            </div>

            <div className="score-overview">
              <div className="overall-score">
                <span className="score-value">{result.overall_score}/10</span>
                <span className="score-label">Overall Score</span>
              </div>
              {result.metrics && (
                <div className="metrics-grid">
                  {Object.entries(result.metrics).map(([key, value]) => (
                    <div key={key} className="metric-item">
                      <span className="metric-value">{Math.round(value * 10)}/10</span>
                      <span className="metric-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.summary && (
              <div className="analysis-section">
                <h4><FaLightbulb /> Executive Summary</h4>
                <p>{result.summary}</p>
              </div>
            )}

            {result.strengths && result.strengths.length > 0 && (
              <div className="analysis-section">
                <h4><FaStar /> Key Strengths</h4>
                <ul>
                  {result.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.improvements && result.improvements.length > 0 && (
              <div className="analysis-section">
                <h4><FaExclamationTriangle /> Areas for Improvement</h4>
                <ul>
                  {result.improvements.map((improvement, i) => (
                    <li key={i}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="analysis-section">
                <h4><FaCheckCircle /> Recommendations</h4>
                <ul>
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.development_plan && result.development_plan.length > 0 && (
              <div className="analysis-section">
                <h4><FaCalendarAlt /> Development Plan</h4>
                <ul>
                  {result.development_plan.map((plan, i) => (
                    <li key={i}>{plan}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'realTime':
        return (
          <div className="analysis-results">
            <div className="results-header">
              <h3><config.icon /> {config.name} Results</h3>
              <div className="action-buttons">
                <button onClick={() => downloadAnalysis(type)} className="action-btn">
                  <FaDownload /> Download
                </button>
                <button onClick={() => shareAnalysis(type)} className="action-btn secondary">
                  <FaShareAlt /> Share
                </button>
              </div>
            </div>

            <div className="real-time-feedback">
              <div className="current-response-score">
                <span className="score-value">{result.current_response_score}/10</span>
                <span className="score-label">Current Response Score</span>
              </div>

              {result.immediate_feedback && (
                <div className="feedback-section">
                  <h4><FaLightbulb /> Immediate Feedback</h4>
                  <p>{result.immediate_feedback}</p>
                </div>
              )}

              {result.suggested_improvements && result.suggested_improvements.length > 0 && (
                <div className="feedback-section">
                  <h4><FaArrowUp /> Quick Improvements</h4>
                  <ul>
                    {result.suggested_improvements.map((improvement, i) => (
                      <li key={i}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.confidence_boosters && result.confidence_boosters.length > 0 && (
                <div className="feedback-section">
                  <h4><FaStar /> Confidence Boosters</h4>
                  <ul>
                    {result.confidence_boosters.map((booster, i) => (
                      <li key={i}>{booster}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.next_question_prep && (
                <div className="feedback-section">
                  <h4><FaPlay /> Next Question Preparation</h4>
                  <p>{result.next_question_prep}</p>
                </div>
              )}

              {result.quick_tips && result.quick_tips.length > 0 && (
                <div className="feedback-section">
                  <h4><FaLightbulb /> Quick Tips</h4>
                  <ul>
                    {result.quick_tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case 'skillAssessment':
        return (
          <div className="analysis-results">
            <div className="results-header">
              <h3><config.icon /> {config.name} Results</h3>
              <div className="action-buttons">
                <button onClick={() => downloadAnalysis(type)} className="action-btn">
                  <FaDownload /> Download
                </button>
                <button onClick={() => shareAnalysis(type)} className="action-btn secondary">
                  <FaShareAlt /> Share
                </button>
              </div>
            </div>

            {result.priority_skills && result.priority_skills.length > 0 && (
              <div className="analysis-section">
                <h4><FaTools /> Priority Skills</h4>
                <ul>
                  {result.priority_skills.map((skill, i) => (
                    <li key={i}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.learning_path && result.learning_path.length > 0 && (
              <div className="analysis-section">
                <h4><FaGraduationCap /> Learning Path</h4>
                <ul>
                  {result.learning_path.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.resource_recommendations && result.resource_recommendations.length > 0 && (
              <div className="analysis-section">
                <h4><FaTools /> Recommended Resources</h4>
                <ul>
                  {result.resource_recommendations.map((resource, i) => (
                    <li key={i}>{resource}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.project_ideas && result.project_ideas.length > 0 && (
              <div className="analysis-section">
                <h4><FaRocket /> Project Ideas</h4>
                <ul>
                  {result.project_ideas.map((project, i) => (
                    <li key={i}>{project}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'careerDevelopment':
        return (
          <div className="analysis-results">
            <div className="results-header">
              <h3><config.icon /> {config.name} Results</h3>
              <div className="action-buttons">
                <button onClick={() => downloadAnalysis(type)} className="action-btn">
                  <FaDownload /> Download
                </button>
                <button onClick={() => shareAnalysis(type)} className="action-btn secondary">
                  <FaShareAlt /> Share
                </button>
              </div>
            </div>

            {result.career_path_analysis && (
              <div className="analysis-section">
                <h4><FaChartLine /> Career Path Analysis</h4>
                <div className="career-path-info">
                  <p><strong>Current Level:</strong> {result.career_path_analysis.current_level}</p>
                  <p><strong>Next Level:</strong> {result.career_path_analysis.next_level}</p>
                </div>
              </div>
            )}

            {result.role_transitions && result.role_transitions.length > 0 && (
              <div className="analysis-section">
                <h4><FaUserTie /> Role Transition Opportunities</h4>
                <ul>
                  {result.role_transitions.map((role, i) => (
                    <li key={i}>{role}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.industry_opportunities && result.industry_opportunities.length > 0 && (
              <div className="analysis-section">
                <h4><FaRocket /> Industry Opportunities</h4>
                <ul>
                  {result.industry_opportunities.map((opportunity, i) => (
                    <li key={i}>{opportunity}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.networking_strategies && result.networking_strategies.length > 0 && (
              <div className="analysis-section">
                <h4><FaUserTie /> Networking Strategies</h4>
                <ul>
                  {result.networking_strategies.map((strategy, i) => (
                    <li key={i}>{strategy}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderRealTimeInput = () => (
    <div className="real-time-input">
      <h3><FaPlay /> Real-Time Interview Mode</h3>
      
      <div className="input-group">
        <label>Current Question:</label>
        <textarea
          value={realTimeData.currentQuestion}
          onChange={(e) => setRealTimeData(prev => ({ ...prev, currentQuestion: e.target.value }))}
          placeholder="Enter the current interview question..."
          rows={3}
        />
      </div>

      <div className="input-group">
        <label>Your Answer:</label>
        <textarea
          value={realTimeData.currentAnswer}
          onChange={(e) => setRealTimeData(prev => ({ ...prev, currentAnswer: e.target.value }))}
          placeholder="Enter your answer..."
          rows={4}
        />
      </div>

      <div className="real-time-actions">
        <button onClick={runQuickAnalysis} className="action-btn" disabled={loading}>
          {loading ? <FaSpinner className="spinner" /> : <FaLightbulb />}
          Get Quick Feedback
        </button>
        <button onClick={addResponse} className="action-btn secondary">
          <FaCheckCircle /> Add Response
        </button>
      </div>

      {realTimeData.previousResponses.length > 0 && (
        <div className="previous-responses">
          <h4>Previous Responses ({realTimeData.previousResponses.length})</h4>
          <div className="responses-list">
            {realTimeData.previousResponses.map((response, i) => (
              <div key={i} className="response-item">
                <div className="response-question">
                  <strong>Q:</strong> {response.question}
                </div>
                <div className="response-answer">
                  <strong>A:</strong> {response.answer}
                </div>
                <div className="response-time">
                  {new Date(response.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysisResults.quickAnalysis && (
        <div className="quick-analysis-results">
          <h4>Quick Analysis Results</h4>
          <div className="quick-score">
            <span className="score-value">{analysisResults.quickAnalysis.current_response_score}/10</span>
            <span className="score-label">Response Score</span>
          </div>
          <p className="quick-feedback">{analysisResults.quickAnalysis.immediate_feedback}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="ai-analysis-tool">
      <div className="tool-header">
        <h2><FaBrain /> AI Interview Analysis Tool</h2>
        <p>Get comprehensive AI-powered insights into your interview performance</p>
        {!sessionData && (
          <div style={{ 
            background: 'rgba(139, 92, 246, 0.2)', 
            padding: '12px 24px', 
            borderRadius: '12px', 
            marginTop: '16px',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <strong>Demo Mode:</strong> Using sample interview data for demonstration. In a real interview, this would contain your actual responses.
          </div>
        )}
      </div>

      <div className="analysis-tabs">
        {Object.entries(analysisTypes).map(([key, config]) => (
          <button
            key={key}
            className={`tab-button ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <config.icon />
            {config.name}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'realTime' && renderRealTimeInput()}

        <div className="analysis-actions">
          {activeTab !== 'realTime' && (
            <button
              onClick={() => runAnalysis(activeTab)}
              className="action-btn primary"
              disabled={loading}
            >
              {loading && currentAnalysis === activeTab ? (
                <>
                  <FaSpinner className="spinner" />
                  Running {analysisTypes[activeTab]?.name}...
                </>
              ) : (
                <>
                  <FaLightbulb />
                  Run {analysisTypes[activeTab]?.name}
                </>
              )}
            </button>
          )}

          {activeTab === 'realTime' && (
            <div className="real-time-controls">
              {!realTimeMode ? (
                <button onClick={startRealTimeMode} className="action-btn primary">
                  <FaPlay /> Start Real-Time Mode
                </button>
              ) : (
                <button onClick={stopRealTimeMode} className="action-btn secondary">
                  <FaStop /> Stop Real-Time Mode
                </button>
              )}
            </div>
          )}
        </div>

        {analysisResults[activeTab] && renderAnalysisResults(activeTab)}

        {activeTab === 'realTime' && analysisResults.quickAnalysis && (
          <div className="quick-analysis-section">
            {renderAnalysisResults('realTime')}
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <FaSpinner className="spinner large" />
            <p>Running AI analysis...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisTool;
