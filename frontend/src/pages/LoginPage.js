import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernPopup from '../components/ModernPopup';
import { showToast } from '../components/Toast';
import config from '../config';
import '../components/ModernUI.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${config.BACKEND_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userOrEmail: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user_email', email);
        showToast('Login successful!', 'success');
        navigate('/dashboard');
      } else {
        setPopupConfig({
          title: 'Login Failed',
          message: data.error || 'Invalid email or password. Please try again.',
          type: 'error'
        });
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Login error:', error);
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

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleDemoLogin = () => {
    setEmail('demo@example.com');
    setPassword('demo123');
    showToast('Demo credentials filled! Click Login to continue.', 'info');
  };

  return (
    <div className="modern-bg" style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ 
        maxWidth: 400, 
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
              Welcome Back
            </h2>
            <p style={{ color: '#d1c4e9' }}>
              Sign in to continue your interview practice
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <div style={{ marginBottom: '24px' }}>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

            {/* Forgot Password Link */}
            <div style={{ 
              textAlign: 'right', 
              marginBottom: '24px'
            }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="modern-btn"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1.1rem',
                fontWeight: '600',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Login */}
          <div style={{ 
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <button
              type="button"
              onClick={handleDemoLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#6ee7b7',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Try Demo Login
            </button>
          </div>

          {/* Sign Up Link */}
          <div style={{ 
            marginTop: '32px',
            textAlign: 'center',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <p style={{ color: '#d1c4e9', marginBottom: '12px' }}>
              Don't have an account?
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="modern-btn"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '1rem'
              }}
            >
              Create Account
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
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
};

export default LoginPage;