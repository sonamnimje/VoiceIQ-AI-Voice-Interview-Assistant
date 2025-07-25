import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { FaUser, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import StartInterviewPage from "./components/StartInterviewPage";
import TranscriptPage from "./components/TranscriptPage";
import ProfileSettingsPage from "./components/ProfileSettingsPage";
import DashboardPage from "./components/DashboardPage";
import FeedbackPage from "./components/FeedbackPage";
import "./components/Wireframe.css";

function App() {
  return (
    <Router>
      <nav className="navbar">
        <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
    <img src="/Logo.png" alt="VoiceIQ Logo" style={{ height: 32, width: 32, objectFit: 'contain', marginRight: 8, filter: 'drop-shadow(0 0 4px #c084fc88) brightness(1.2)' }} />
    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#c084fc', letterSpacing: 1 }}>VoiceIQ</span>
  </Link>
</div>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/interview">Start Interview</Link>
          <Link to="/transcripts">Transcripts</Link>
          <Link to="/feedback">AI Feedback</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div className="navbar-icons">
          <Link to="/profile" title="Profile"><FaUser size={22} /></Link>
          <span title="Logout" style={{ cursor: 'pointer', marginLeft: 10, background: 'rgba(34,34,68,0.85)', color: '#fff', borderRadius: '6px', padding: '3px 6px' }} onClick={() => { localStorage.clear(); window.location.href = '/login'; }}><FaSignOutAlt size={22} /></span>
        </div>
      </nav>
      <Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/interview" element={<StartInterviewPage />} />
  <Route path="/profile" element={<ProfileSettingsPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/transcripts" element={<TranscriptPage />} />
  <Route path="/feedback" element={<FeedbackPage />} />
</Routes>
    </Router>
  );
}

export default App;
