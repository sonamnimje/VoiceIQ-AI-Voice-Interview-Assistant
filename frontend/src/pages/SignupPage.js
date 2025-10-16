import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernPopup from '../components/ModernPopup';
import { showToast } from '../components/Toast';
import config, { apiUrl } from '../config';
import '../components/ModernUI.css';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return false;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl('/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPopupConfig({
          title: 'Account Created!',
          message: 'Your account has been created successfully. You can now log in with your credentials.',
          type: 'success',
          actions: [
            <button 
              key="login" 
              onClick={() => {
                setShowPopup(false);
                navigate('/login');
              }}
              style={{
                background: 'linear-gradient(90deg, #34d399 0%, #34d39980 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: '80px',
                boxShadow: '0 4px 12px #34d39940'
              }}
            >
              Go to Login
            </button>
          ]
        });
        setShowPopup(true);
      } else {
        let errorMessage = 'Failed to create account. Please try again.';
        
        // Handle specific error cases - FastAPI returns error in 'detail' field
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        }
        
        setPopupConfig({
          title: 'Signup Failed',
          message: errorMessage,
          type: 'error'
        });
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setPopupConfig({
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        type: 'error'
      });
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignup = () => {
    setFormData({
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'demo123',
      confirmPassword: 'demo123'
    });
    showToast('Demo credentials filled! Click Sign Up to continue.', 'info');
  };

  return (
    <div className="modern-bg" style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ 
        maxWidth: 450, 
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div className="glass-card" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ 
              color: '#c084fc', 
              fontSize: '2rem', 
              fontWeight: 700,
              marginBottom: '8px'
            }}>
              Create Account
            </h2>
            <p style={{ color: '#d1c4e9' }}>
              Join AI Voice Interview to start practicing
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#fff',
                fontWeight: '600'
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(192,132,252,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c084fc';
                  e.target.style.boxShadow = '0 0 0 3px rgba(192,132,252,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(192,132,252,0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#fff',
                fontWeight: '600'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(192,132,252,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c084fc';
                  e.target.style.boxShadow = '0 0 0 3px rgba(192,132,252,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(192,132,252,0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#fff',
                fontWeight: '600'
              }}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a password (min 6 characters)"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(192,132,252,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c084fc';
                  e.target.style.boxShadow = '0 0 0 3px rgba(192,132,252,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(192,132,252,0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#fff',
                fontWeight: '600'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(192,132,252,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c084fc';
                  e.target.style.boxShadow = '0 0 0 3px rgba(192,132,252,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(192,132,252,0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="modern-btn"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.2rem',
                fontWeight: '700',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%)',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(192, 132, 252, 0.2)',
                border: 'none',
                borderRadius: '50px',
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.6), 0 0 0 2px rgba(192, 132, 252, 0.3)';
                  e.target.style.background = 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #d8b4fe 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(192, 132, 252, 0.2)';
                  e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%)';
                }
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Demo Signup */}
          <div style={{ 
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <button
              type="button"
              onClick={handleDemoSignup}
              style={{
                background: 'none',
                border: 'none',
                color: '#6ee7b7',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Try Demo Signup
            </button>
          </div>

          {/* Login Link */}
          <div style={{ 
            marginTop: '32px',
            textAlign: 'center',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <p style={{ color: '#d1c4e9', marginBottom: '12px' }}>
              Already have an account?
            </p>
            <button
              onClick={() => navigate('/login')}
              className="modern-btn"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '1rem'
              }}
            >
              Sign In
            </button>
          </div>

          {/* Back to Landing */}
          <div style={{ 
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#aaa',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Modern Popup */}
      <ModernPopup
        open={showPopup}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
        actions={popupConfig.actions}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
};

export default SignupPage;