import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { FaUser, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
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
import "./App.css";
import "./components/Wireframe.css";
import "./navbar.css";

function AppContent() {
  const location = useLocation();

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
          <Link to="/feedback" className={location.pathname === '/feedback' ? 'active' : ''}>Feedback</Link>
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
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
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/profile" element={<ProfileSettingsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <AppContent />
  );
}

export default App;
