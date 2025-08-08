import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { FaUser, FaSignInAlt, FaSignOutAlt, FaChartLine, FaBrain, FaCaretDown } from "react-icons/fa";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import DashboardPage from "./pages/DashboardPage";

import PracticePage from "./pages/PracticePage";
import StartInterviewPage from "./pages/StartInterviewPage";
import InterviewPage from "./pages/InterviewPage";
import FeedbackPage from "./pages/FeedbackPage";
import EnhancedFeedback from "./components/EnhancedFeedback";
import { FeedbackProvider, useFeedback } from "./contexts/FeedbackContext";
import "./App.css";
import "./components/Wireframe.css";
import "./navbar.css";

function AppContent() {
  const location = useLocation();
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { 
    showEnhancedFeedback, 
    enhancedFeedbackData, 
    currentSessionMode, 
    currentRole,
    openEnhancedFeedback, 
    closeEnhancedFeedback 
  } = useFeedback();

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFeedbackDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFeedbackClick = (e) => {
    e.preventDefault();
    setShowFeedbackDropdown(!showFeedbackDropdown);
  };

  const handleEnhancedFeedback = () => {
    openEnhancedFeedback();
    setShowFeedbackDropdown(false);
  };

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('user_email');

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/Logo.png" alt="VoiceIQ Logo" style={{ height: 32, width: 32, objectFit: 'contain', marginRight: 8, filter: 'drop-shadow(0 0 4px #c084fc88) brightness(1.2)' }} />
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#c084fc', letterSpacing: 1 }}>VoiceIQ</span>
          </Link>
        </div>
        <div className="navbar-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/start-interview" className={location.pathname === '/start-interview' ? 'active' : ''}>Start Interview</Link>
          <Link to="/practice" className={location.pathname === '/practice' ? 'active' : ''}>Practice</Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
          
          {/* Enhanced Feedback Dropdown */}
          <div className="feedback-dropdown" ref={dropdownRef}>
            <button 
              className={`feedback-dropdown-btn ${location.pathname === '/feedback' ? 'active' : ''}`}
              onClick={handleFeedbackClick}
            >
              <FaChartLine />
              Feedback
              <FaCaretDown className={`dropdown-arrow ${showFeedbackDropdown ? 'rotated' : ''}`} />
            </button>
            {showFeedbackDropdown && (
              <div className="feedback-dropdown-menu">
                <Link 
                  to="/feedback" 
                  className="dropdown-item"
                  onClick={() => setShowFeedbackDropdown(false)}
                >
                  <FaChartLine />
                  Performance History
                </Link>
                <button 
                  className="dropdown-item"
                  onClick={handleEnhancedFeedback}
                >
                  <FaBrain />
                  AI Analysis
                </button>
                <Link 
                  to="/feedback" 
                  className="dropdown-item"
                  onClick={() => {
                    setShowFeedbackDropdown(false);
                    // You can add specific parameters here for different feedback views
                  }}
                >
                  <FaChartLine />
                  Progress Tracking
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="navbar-icons">
          <Link to="/profile" title="Profile"><FaUser size={20} /></Link>
          <span title="Logout" onClick={() => { localStorage.clear(); window.location.href = '/'; }}><FaSignOutAlt size={20} /></span>
        </div>
      </nav>
      
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/start-interview" element={<StartInterviewPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/profile" element={<ProfileSettingsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Routes>
        </div>
      </div>

      {/* Enhanced Feedback Modal */}
      {showEnhancedFeedback && (
        <EnhancedFeedback
          feedbackData={enhancedFeedbackData || {
            overall_score: 7.5,
            communication_clarity: 8.0,
            technical_depth: 7.0,
            emotional_intelligence: 8.5,
            cultural_fit: 7.5,
            problem_solving: 7.8,
            confidence_level: 8.2,
            leadership_potential: 7.0,
            innovation_creativity: 7.5,
            stress_management: 8.0,
            adaptability: 7.8,
            specificity: 7.5,
            relevance: 8.0,
            strengths: [
              "Strong communication skills",
              "Good emotional intelligence",
              "Confident delivery"
            ],
            improvements: [
              "Provide more specific examples",
              "Enhance technical depth",
              "Practice time management"
            ],
            keywords_found: ["experience", "teamwork", "problem-solving"],
            consistency_score: 7.8,
            improvement_trend: "improving",
            strongest_areas: ["Communication", "Emotional Intelligence"],
            weakest_areas: ["Technical Depth", "Time Management"]
          }}
          onClose={closeEnhancedFeedback}
          sessionMode={currentSessionMode}
          role={currentRole}
        />
      )}
    </>
  );
}

function App() {
  return (
    <FeedbackProvider>
      <AppContent />
    </FeedbackProvider>
  );
}

export default App;
