import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaLightbulb, 
  FaRedo, 
  FaHome, 
  FaPlayCircle, 
  FaDownload, 
  FaFilePdf, 
  FaFileAlt, 
  FaStar, 
  FaChartLine, 
  FaUserTie, 
  FaRocket,
  FaGraduationCap,
  FaTools,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowUp,
  FaShareAlt
} from 'react-icons/fa';
import config from '../config';
import { showToast } from '../components/Toast';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, responses, config: interviewConfig } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    strengths: true,
    improvements: true,
    recommendations: true,
    nextSteps: true,
    careerAdvice: true,
    skillGaps: true,
    developmentPlan: true
  });
  const [demoMode, setDemoMode] = useState(false);
  

  // Demo data for testing when no real interview data is available
  const demoData = {
    sessionId: 'demo-session-123',
    responses: [
      {
        questionIndex: 0,
        question: "Tell me about yourself and your background in software development.",
        answer: "I'm a software engineer with 3 years of experience in full-stack development, primarily working with React, Node.js, and Python. I've worked on several web applications and have experience with cloud platforms like AWS."
      },
      {
        questionIndex: 1,
        question: "What is your experience with React hooks?",
        answer: "I've been using React hooks extensively for the past 2 years. I'm comfortable with useState, useEffect, useContext, and custom hooks. I've also worked with libraries like React Query and Redux Toolkit."
      },
      {
        questionIndex: 2,
        question: "How do you handle state management in large applications?",
        answer: "For smaller applications, I use React's built-in state and Context API. For larger applications, I prefer Redux Toolkit or Zustand for global state management, combined with React Query for server state."
      }
    ],
    config: {
      role: 'Frontend Developer',
      type: 'technical',
      difficulty: 'intermediate',
      duration: 45
    }
  };

  const demoFeedback = {
    summary: "You demonstrated solid technical knowledge and good communication skills. Your experience with modern React patterns and state management shows you're well-versed in current frontend development practices. However, there are areas where you could provide more specific examples and demonstrate deeper problem-solving skills.",
    overall_score: 7,
    technical_score: 8,
    communication_score: 7,
    confidence_score: 6,
    strengths: [
      "Strong understanding of React hooks and modern patterns",
      "Good knowledge of state management solutions",
      "Clear communication of technical concepts",
      "Relevant work experience in the field"
    ],
    improvements: [
      "Provide more specific examples from your projects",
      "Demonstrate problem-solving approach with concrete scenarios",
      "Show more enthusiasm and confidence in your responses",
      "Include metrics and quantifiable results from your work"
    ],
    recommendations: [
      "Practice explaining complex technical concepts in simple terms",
      "Prepare specific examples of challenges you've solved",
      "Work on presenting your achievements with measurable impact",
      "Practice mock interviews focusing on behavioral questions"
    ],
    next_steps: [
      "Review and document your key project achievements",
      "Practice explaining technical decisions and trade-offs",
      "Build a portfolio showcasing your best work",
      "Seek feedback from peers on your communication style"
    ],
    career_advice: [
      "Consider specializing in a specific frontend framework or tool",
      "Build open-source contributions to demonstrate your skills",
      "Network with other developers in your area of expertise",
      "Stay updated with the latest frontend technologies and trends"
    ],
    skill_gaps: [
      "Advanced problem-solving and system design",
      "Performance optimization and debugging",
      "Testing strategies and quality assurance",
      "DevOps and deployment practices"
    ],
    development_plan: [
      "30 days: Master advanced React patterns and performance optimization",
      "60 days: Build a complex application showcasing your skills",
      "90 days: Contribute to open-source projects and mentor others"
    ]
  };

  const sessionPayload = useMemo(() => {
    // Use demo data if no real data is available
    const data = sessionId ? { sessionId, responses, config: interviewConfig } : demoData;
    
    const role = data.config?.role || 'Software Engineer';
    const type = data.config?.type || 'mixed';
    const difficulty = data.config?.difficulty || 'intermediate';
    const duration = data.config?.duration || 30;

    const normalizedResponses = Array.isArray(data.responses)
      ? data.responses.map((r, idx) => ({
          index: r.questionIndex ?? idx,
          question: r.question,
          answer: r.answer,
          timestamp: r.timestamp || null
        }))
      : [];

    return {
      session_id: data.sessionId || 'ad-hoc',
      role,
      type,
      difficulty,
      duration,
      responses: normalizedResponses,
      metadata: {
        total_questions: normalizedResponses.length,
        completed_at: new Date().toISOString()
      }
    };
  }, [sessionId, responses, interviewConfig]);

  const fetchComprehensiveFeedback = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      
      // If in demo mode, use demo feedback
      if (!sessionId) {
        setTimeout(() => {
          setAiFeedback(demoFeedback);
          setLoading(false);
          setDemoMode(true);
        }, 2000); // Simulate API delay
        return;
      }

      const res = await fetch(`${config.BACKEND_URL}/api/llm/comprehensive-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_data: payload, role: payload.role })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to get AI feedback');
      }
      setAiFeedback(data.feedback);
    } catch (e) {
      setError(e.message);
      showToast('Could not retrieve AI feedback. Showing your raw responses instead.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const downloadFeedback = async () => {
    if (!aiFeedback) {
      showToast('No feedback available to download', 'error');
      return;
    }

    setIsDownloading(true);
    try {
      let content = '';
      let filename = '';

      if (downloadFormat === 'pdf') {
        // For PDF, we'll create a formatted text that can be copied to a PDF generator
        content = generateFeedbackText();
        filename = `feedback-${sessionPayload.session_id || 'session'}-${new Date().toISOString().split('T')[0]}.txt`;
        
        // Create and download text file (user can convert to PDF)
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Feedback downloaded! You can convert the text file to PDF using any PDF converter.', 'success');
      } else if (downloadFormat === 'json') {
        const feedbackData = {
          session: sessionPayload,
          feedback: aiFeedback,
          downloadDate: new Date().toISOString()
        };
        content = JSON.stringify(feedbackData, null, 2);
        filename = `feedback-${sessionPayload.session_id || 'session'}-${new Date().toISOString().split('T')[0]}.json`;
        
        const blob = new Blob([content], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Feedback downloaded as JSON!', 'success');
      }
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download feedback', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const generateFeedbackText = () => {
    let text = `INTERVIEW FEEDBACK REPORT\n`;
    text += `================================\n\n`;
    text += `Session ID: ${sessionPayload.session_id || 'N/A'}\n`;
    text += `Role: ${sessionPayload.role || 'N/A'}\n`;
    text += `Type: ${sessionPayload.type || 'N/A'}\n`;
    text += `Difficulty: ${sessionPayload.difficulty || 'N/A'}\n`;
    text += `Duration: ${sessionPayload.duration || 'N/A'} minutes\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;

    if (aiFeedback.summary) {
      text += `EXECUTIVE SUMMARY\n`;
      text += `----------------\n${aiFeedback.summary}\n\n`;
    }

    if (aiFeedback.overall_score !== undefined) {
      text += `SCORES\n`;
      text += `------\n`;
      text += `Overall Score: ${aiFeedback.overall_score}/10\n`;
      if (aiFeedback.technical_score !== undefined) text += `Technical Score: ${aiFeedback.technical_score}/10\n`;
      if (aiFeedback.communication_score !== undefined) text += `Communication Score: ${aiFeedback.communication_score}/10\n`;
      if (aiFeedback.confidence_score !== undefined) text += `Confidence Score: ${aiFeedback.confidence_score}/10\n`;
      text += `\n`;
    }

    if (aiFeedback.strengths?.length) {
      text += `STRENGTHS\n`;
      text += `---------\n`;
      aiFeedback.strengths.forEach((strength, i) => {
        text += `${i + 1}. ${strength}\n`;
      });
      text += `\n`;
    }

    if (aiFeedback.improvements?.length) {
      text += `AREAS FOR IMPROVEMENT\n`;
      text += `---------------------\n`;
      aiFeedback.improvements.forEach((improvement, i) => {
        text += `${i + 1}. ${improvement}\n`;
      });
      text += `\n`;
    }

    if (aiFeedback.recommendations?.length) {
      text += `RECOMMENDED ACTIONS\n`;
      text += `-------------------\n`;
      aiFeedback.recommendations.forEach((rec, i) => {
        text += `${i + 1}. ${rec}\n`;
      });
      text += `\n`;
    }

    if (aiFeedback.next_steps?.length) {
      text += `NEXT STEPS\n`;
      text += `----------\n`;
      aiFeedback.next_steps.forEach((step, i) => {
        text += `${i + 1}. ${step}\n`;
      });
      text += `\n`;
    }

    if (aiFeedback.career_advice?.length) {
      text += `CAREER ADVICE\n`;
      text += `-------------\n`;
      aiFeedback.career_advice.forEach((advice, i) => {
        text += `${i + 1}. ${advice}\n`;
      });
      text += `\n`;
    }

    if (aiFeedback.skill_gaps?.length) {
      text += `SKILL GAPS\n`;
      text += `----------\n`;
      aiFeedback.skill_gaps.forEach((gap, i) => {
        text += `${i + 1}. ${gap}\n`;
      });
      text += `\n`;
    }

    if (aiFeedback.development_plan?.length) {
      text += `30-60-90 DAY DEVELOPMENT PLAN\n`;
      text += `-------------------------------\n`;
      aiFeedback.development_plan.forEach((plan, i) => {
        text += `${i + 1}. ${plan}\n`;
      });
      text += `\n`;
    }

    if (sessionPayload.responses?.length) {
      text += `INTERVIEW RESPONSES\n`;
      text += `------------------\n`;
      sessionPayload.responses.forEach((response, i) => {
        text += `Question ${i + 1}: ${response.question}\n`;
        text += `Answer: ${response.answer || 'No answer provided'}\n\n`;
      });
    }

    return text;
  };

  const shareFeedback = () => {
    if (navigator.share) {
      const feedbackText = generateFeedbackText();
      navigator.share({
        title: 'Interview Feedback Report',
        text: feedbackText.substring(0, 100) + '...',
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      const feedbackText = generateFeedbackText();
      navigator.clipboard.writeText(feedbackText).then(() => {
        showToast('Feedback copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Failed to copy feedback', 'error');
      });
    }
  };

  const handleAnalysisComplete = (type, result) => {
    showToast(`${type} analysis completed successfully!`, 'success');
    // You can store the analysis results or perform additional actions here
  };

  useEffect(() => {
    if (Array.isArray(sessionPayload.responses) && sessionPayload.responses.length > 0) {
      fetchComprehensiveFeedback(sessionPayload);
    }
  }, [sessionPayload]);

  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981'; // Green
    if (score >= 6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getSectionIcon = (section) => {
    const icons = {
      strengths: FaStar,
      improvements: FaExclamationTriangle,
      recommendations: FaCheckCircle,
      nextSteps: FaArrowUp,
      careerAdvice: FaUserTie,
      skillGaps: FaTools,
      developmentPlan: FaCalendarAlt
    };
    return icons[section] || FaLightbulb;
  };

  if (!sessionId && !demoMode) {
    return (
      <div className="feedback-page">
        <div className="feedback-container">
          <div className="no-data">
            <h3>No Interview Data Found</h3>
            <p>It looks like you haven't completed an interview yet, or the session data is missing.</p>
            <div className="action-buttons">
              <button className="action-btn" onClick={() => fetchComprehensiveFeedback(sessionPayload)}>
                <FaLightbulb /> Try Demo Mode
              </button>
              <button className="action-btn secondary" onClick={() => navigate('/dashboard')}>
                <FaHome /> Dashboard
              </button>
              <button className="action-btn" onClick={() => navigate('/start-interview')}>
                <FaPlayCircle /> Start Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

 

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-header">
          <h2>
            <span className="header-icon"><FaLightbulb /></span>
            Interview Feedback & Analysis
          </h2>
          <p>Comprehensive insights to help you improve your interview performance</p>
          {demoMode && (
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.2)', 
              padding: '12px 24px', 
              borderRadius: '12px', 
              marginTop: '16px',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <strong>Demo Mode:</strong> This is sample feedback data for demonstration purposes.
            </div>
          )}
        </div>

        <div className="session-info">
          <h3>Session Information</h3>
          <div className="session-grid">
            <div className="session-item">
              <strong>Session ID</strong>
              <span>{sessionPayload.session_id}</span>
            </div>
            <div className="session-item">
              <strong>Role</strong>
              <span>{sessionPayload.role}</span>
            </div>
            <div className="session-item">
              <strong>Interview Type</strong>
              <span>{sessionPayload.type}</span>
            </div>
            <div className="session-item">
              <strong>Difficulty</strong>
              <span>{sessionPayload.difficulty}</span>
            </div>
            <div className="session-item">
              <strong>Duration</strong>
              <span>{sessionPayload.duration} minutes</span>
            </div>
            <div className="session-item">
              <strong>Questions</strong>
              <span>{sessionPayload.responses?.length || 0}</span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h3>Generating AI Feedback...</h3>
            <p>Analyzing your responses and creating personalized insights</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <h3>Feedback Generation Failed</h3>
            <p>{error}</p>
            <button className="action-btn" onClick={() => fetchComprehensiveFeedback(sessionPayload)}>
              <FaRedo /> Try Again
            </button>
          </div>
        )}

        {aiFeedback && (
          <>
            <div className="feedback-grid">
              <div className="feedback-card">
                <h3>
                  <FaChartLine className="card-icon" />
                  Executive Summary
                </h3>
                <p>{aiFeedback.summary || 'AI summary not available.'}</p>
                
                {('overall_score' in aiFeedback || 'technical_score' in aiFeedback || 
                  'communication_score' in aiFeedback || 'confidence_score' in aiFeedback) && (
                  <div className="scores-grid">
                    {'overall_score' in aiFeedback && (
                      <div className="score-item">
                        <div className="score-value" style={{ color: getScoreColor(aiFeedback.overall_score) }}>
                          {aiFeedback.overall_score}
                        </div>
                        <div className="score-label">Overall</div>
                      </div>
                    )}
                    {'technical_score' in aiFeedback && (
                      <div className="score-item">
                        <div className="score-value" style={{ color: getScoreColor(aiFeedback.technical_score) }}>
                          {aiFeedback.technical_score}
                        </div>
                        <div className="score-label">Technical</div>
                      </div>
                    )}
                    {'communication_score' in aiFeedback && (
                      <div className="score-item">
                        <div className="score-value" style={{ color: getScoreColor(aiFeedback.communication_score) }}>
                          {aiFeedback.communication_score}
                        </div>
                        <div className="score-label">Communication</div>
                      </div>
                    )}
                    {'confidence_score' in aiFeedback && (
                      <div className="score-item">
                        <div className="score-value" style={{ color: getScoreColor(aiFeedback.confidence_score) }}>
                          {aiFeedback.confidence_score}
                        </div>
                        <div className="score-label">Confidence</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {Object.entries(expandedSections).map(([section, isExpanded]) => {
                const sectionData = aiFeedback[section];
                if (!sectionData || !Array.isArray(sectionData) || sectionData.length === 0) return null;
                
                const IconComponent = getSectionIcon(section);
                const sectionTitles = {
                  strengths: 'Key Strengths',
                  improvements: 'Areas for Improvement',
                  recommendations: 'Recommended Actions',
                  nextSteps: 'Next Steps',
                  careerAdvice: 'Career Advice',
                  skillGaps: 'Skill Gaps',
                  developmentPlan: '30-60-90 Day Plan'
                };

                return (
                  <div key={section} className="feedback-card">
                    <h3 
                      onClick={() => toggleSection(section)}
                      style={{ cursor: 'pointer' }}
                    >
                      <IconComponent className="card-icon" />
                      {sectionTitles[section]}
                      <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>
                        {isExpanded ? '−' : '+'}
                      </span>
                    </h3>
                    {isExpanded && (
                      <ul>
                        {sectionData.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="download-section">
              <h3><FaDownload /> Download Your Feedback</h3>
              <p>Save your feedback report for future reference and sharing</p>
              
              <div className="download-options">
                <label className={`download-option ${downloadFormat === 'pdf' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={downloadFormat === 'pdf'}
                    onChange={(e) => setDownloadFormat(e.target.value)}
                  />
                  <FaFilePdf />
                  PDF Format
                </label>
                <label className={`download-option ${downloadFormat === 'json' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={downloadFormat === 'json'}
                    onChange={(e) => setDownloadFormat(e.target.value)}
                  />
                  <FaFileAlt />
                  JSON Format
                </label>
              </div>

              <div className="actions-section">
                <button 
                  className="action-btn" 
                  onClick={downloadFeedback}
                  disabled={isDownloading}
                >
                  <FaDownload />
                  {isDownloading ? 'Downloading...' : 'Download Feedback'}
                </button>
                <button className="action-btn secondary" onClick={shareFeedback}>
                  <FaShareAlt />
                  Share Feedback
                </button>
              </div>
            </div>
          </>
        )}

        {!aiFeedback && Array.isArray(sessionPayload.responses) && sessionPayload.responses.length > 0 && !loading && (
          <div className="responses-section">
            <h3>Your Interview Responses</h3>
            <p>While we generate AI feedback, here are your responses:</p>
            
            {sessionPayload.responses.map((r, idx) => (
              <div key={idx} className="response-item">
                <div className="response-question">
                  Q{(r.index ?? idx) + 1}: {r.question}
                </div>
                {r.answer && (
                  <div className="response-answer">
                    <strong>Your Answer:</strong> {r.answer}
                  </div>
                )}
              </div>
            ))}
            
            <div className="actions-section">
              <button className="action-btn" onClick={() => fetchComprehensiveFeedback(sessionPayload)}>
                <FaRedo /> Generate AI Feedback
              </button>
            </div>
          </div>
        )}

        <div className="actions-section">
          
          <button className="action-btn secondary" onClick={() => navigate('/dashboard')}>
            <FaHome /> Back to Dashboard
          </button>
          <button className="action-btn" onClick={() => navigate('/start-interview')}>
            <FaPlayCircle /> Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;


