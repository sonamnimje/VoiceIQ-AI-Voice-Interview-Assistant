import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Centerpiece from '../components/Centerpiece';
import ModernPopup from '../components/ModernPopup';
import { showToast } from '../components/Toast';
import '../components/ModernUI.css';
import '../components/ModernAnimations.css';

const LandingPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const navigate = useNavigate();

  const handleGetStarted = () => {
    showToast('Welcome to AI Voice Interview!', 'success');
    navigate('/login');
  };

  const handleLearnMore = () => {
    setPopupConfig({
      title: 'About AI Voice Interview',
      message: 'AI Voice Interview is a user-friendly platform that uses artificial intelligence to provide realistic interview practice sessions. Our voice recognition and personalized feedback help you improve your interview skills and confidence.',
      type: 'info'
    });
    setShowPopup(true);
  };

  const handleFeatures = () => {
    setPopupConfig({
      title: 'Key Features',
      message: '🎤 Voice recognition\n📊 Performance analytics\n🎯 Custom interview modes\n📝 Detailed feedback\n💾 Session recording\n📱 Cross-platform support',
      type: 'info'
    });
    setShowPopup(true);
  };

  return (
    <div className="modern-bg" style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 80px)',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        {/* Centerpiece Component */}
        <Centerpiece />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 700, 
            color: '#c084fc',
            marginBottom: '20px',
            textShadow: '0 0 20px rgba(192,132,252,0.5)'
          }}>
            AI Voice Interview
          </h1>
          
          <p style={{ 
            fontSize: '1.3rem', 
            color: '#d1c4e9', 
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            Master your interview skills with AI-powered voice recognition 
            and personalized feedback
          </p>

          {/* Feature Highlights */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '24px',
            marginBottom: '50px'
          }}>
            <div style={{ 
              background: 'rgba(192,132,252,0.1)', 
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(192,132,252,0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎤</div>
              <h3 style={{ color: '#fff', marginBottom: '8px' }}>Voice Recognition</h3>
              <p style={{ color: '#d1c4e9', fontSize: '0.9rem' }}>
                Real-time speech-to-text with high accuracy
              </p>
            </div>

            <div style={{ 
              background: 'rgba(251,191,36,0.1)', 
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(251,191,36,0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
              <h3 style={{ color: '#fff', marginBottom: '8px' }}>Analytics</h3>
              <p style={{ color: '#d1c4e9', fontSize: '0.9rem' }}>
                Detailed performance insights and feedback
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '24px',
            flexWrap: 'wrap',
            marginTop: '20px'
          }}>
            <button 
              className="modern-btn"
              onClick={handleGetStarted}
              style={{
                fontSize: '1.2rem',
                padding: '16px 32px',
                background: 'linear-gradient(90deg, #c084fc 0%, #a78bfa 100%)',
                boxShadow: '0 8px 32px rgba(192,132,252,0.3)'
              }}
            >
              🚀 Get Started
            </button>
            
            <button 
              className="modern-btn"
              onClick={handleFeatures}
              style={{
                fontSize: '1.1rem',
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              ✨ Features
            </button>
            
            <button 
              className="modern-btn"
              onClick={handleLearnMore}
              style={{
                fontSize: '1.1rem',
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              ℹ️ Learn More
            </button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{ 
        padding: '100px 20px',
        background: 'rgba(34,34,68,0.5)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            color: '#c084fc',
            marginBottom: '80px',
            fontWeight: 700
          }}>
            How It Works
          </h2>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '50px',
            alignItems: 'start'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c084fc 0%, #a78bfa 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 30px',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(192,132,252,0.3)'
              }}>
                1
              </div>
              <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.5rem', fontWeight: 600 }}>Choose Your Role</h3>
              <p style={{ color: '#d1c4e9', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Select from various job roles and difficulty levels to match your career goals
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 30px',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(110,231,183,0.3)'
              }}>
                2
              </div>
              <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.5rem', fontWeight: 600 }}>Practice Interview</h3>
              <p style={{ color: '#d1c4e9', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Engage in realistic AI-powered interviews with voice recognition
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 30px',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(251,191,36,0.3)'
              }}>
                3
              </div>
              <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.5rem', fontWeight: 600 }}>Get Feedback</h3>
              <p style={{ color: '#d1c4e9', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Receive detailed analytics and personalized improvement suggestions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '60px 20px',
        background: 'rgba(34,34,68,0.8)',
        borderTop: '1px solid rgba(192,132,252,0.2)'
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <p style={{ color: '#d1c4e9', marginBottom: '30px', fontSize: '1.3rem', fontWeight: 500 }}>
            Ready to ace your next interview?
          </p>
          <button 
            className="modern-btn"
            onClick={handleGetStarted}
            style={{
              fontSize: '1.2rem',
              padding: '16px 32px',
              background: 'linear-gradient(90deg, #c084fc 0%, #a78bfa 100%)',
              boxShadow: '0 8px 32px rgba(192,132,252,0.3)'
            }}
          >
            🚀 Start Your Journey
          </button>
          
          <div style={{ 
            marginTop: '50px',
            paddingTop: '30px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            color: '#aaa',
            fontSize: '0.9rem'
          }}>
            <p>© 2025 AI Voice Interview. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Modern Popup */}
      <ModernPopup
        open={showPopup}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
};

export default LandingPage;
