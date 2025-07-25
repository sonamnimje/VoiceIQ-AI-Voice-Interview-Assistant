import React from 'react';
import './ModernUI.css';
import './ModernAnimations.css';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="modern-bg fade-in">
        <div className="glass-card bounce-in" style={{ width: '100%', maxWidth: 600, margin: 'auto' }}>
          {/* Hero Section */}
          <header className="modern-header slide-up" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/Logo.png" alt="VoiceIQ Logo" className="modern-logo glow-animate" style={{ height: '48px', width: '48px', objectFit: 'contain' }} />
            <span className="app-title-navbar" style={{ marginLeft: 16, fontWeight: 'bold', fontSize: '1.5rem', color: '#c084fc', letterSpacing: 1 }}>
              VoiceIQ
            </span>
            <a href="#signin" className="modern-link" style={{ marginLeft: 'auto' }}>Sign in</a>
          </header>
          <main className="modern-main">
            <section style={{ textAlign: 'center', marginTop: 24 }}>
              <h1 className="modern-title fade-in" style={{ animationDelay: '0.2s', fontSize: '2.2rem', fontWeight: 700 }}>
                AI-Powered Voice Interviews
              </h1>
              <p className="modern-desc slide-up" style={{ animationDelay: '0.4s', fontSize: '1.1rem', color: '#b0b0b0' }}>
                Attracting users, showcasing features, and helping you ace interviews with real-time AI.
              </p>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 16 }}>
                <button className="modern-btn bounce-in" style={{ animationDelay: '0.6s' }} onClick={() => navigate('/login')}>Start Interview</button>
              </div>
          </section>

          {/* Features Block */}
          <section className="modern-features" style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="modern-feature fade-in" style={{ animationDelay: '0.7s' }}>
              <span role="img" aria-label="mic" style={{ fontSize: 28 }}>🎤</span>
              <strong>Real-Time Interaction</strong>
              <p>Converse instantly with our AI interviewer.</p>
            </div>
            <div className="modern-feature fade-in" style={{ animationDelay: '0.8s' }}>
              <span role="img" aria-label="brain" style={{ fontSize: 28 }}>🧠</span>
              <strong>Smart AI Feedback</strong>
              <p>Receive actionable, intelligent feedback after every answer.</p>
            </div>
            <div className="modern-feature fade-in" style={{ animationDelay: '0.9s' }}>
              <span role="img" aria-label="transcript" style={{ fontSize: 28 }}>📄</span>
              <strong>Interview Transcripts</strong>
              <p>Get detailed transcripts for review and improvement.</p>
            </div>
            <div className="modern-feature fade-in" style={{ animationDelay: '1.0s' }}>
              <span role="img" aria-label="globe" style={{ fontSize: 28 }}>🌐</span>
              <strong>Multilingual Support</strong>
              <p>Practice interviews in your preferred language.</p>
            </div>
          </section>

          {/* How It Works */}
          <section style={{ marginTop: 48, textAlign: 'center' }}>
            <h2 style={{ color: '#c084fc', fontWeight: 600, marginBottom: 16 }}>How It Works</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
              <div className="how-step fade-in" style={{ animationDelay: '1.1s', minWidth: 90 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>1️⃣</div>
                <div style={{ fontWeight: 500 }}>Login</div>
                <div style={{ fontSize: 13, color: '#aaa' }}>Sign in to get started</div>
              </div>
              <div className="how-step fade-in" style={{ animationDelay: '1.2s', minWidth: 90 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>2️⃣</div>
                <div style={{ fontWeight: 500 }}>Speak</div>
                <div style={{ fontSize: 13, color: '#aaa' }}>Answer questions in real time</div>
              </div>
              <div className="how-step fade-in" style={{ animationDelay: '1.3s', minWidth: 90 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>3️⃣</div>
                <div style={{ fontWeight: 500 }}>Get Feedback</div>
                <div style={{ fontSize: 13, color: '#aaa' }}>AI provides instant feedback</div>
              </div>
            </div>
          </section>
        </main>
        {/* Footer */}

      </div>
    </div>
  </>
  );
};

export default LandingPage;
