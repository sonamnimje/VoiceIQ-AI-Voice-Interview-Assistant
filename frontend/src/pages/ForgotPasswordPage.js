import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import config from '../config';
import '../components/ModernUI.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(token ? 'reset' : 'request'); // 'request' or 'reset'
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      showMessage('Please enter your email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.BACKEND_URL}/forgot_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage(data.message, 'success');
        // In development, show the token for testing
        if (data.reset_token) {
          const resetUrl = `${window.location.origin}/forgot-password?token=${data.reset_token}&email=${email}`;
          setMessage(`Reset URL: ${resetUrl}`);
          setMessageType('info');
        }
      } else {
        showMessage(data.error || 'Failed to send reset email', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        email,
        token,
        newPassword,
      };
      console.log('Sending reset password request:', requestBody);
      
      const response = await fetch(`${config.BACKEND_URL}/reset_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Password reset successfully! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showMessage(data.error || 'Failed to reset password', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!token || !email) {
      showMessage('Invalid reset link', 'error');
      return;
    }

    setLoading(true);
    try {
      const requestBody = { email, token };
      console.log('Sending verify token request:', requestBody);
      
      const response = await fetch('${config.BACKEND_URL}/verify_reset_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setStep('reset');
        showMessage('Token verified. Please enter your new password.', 'success');
      } else {
        showMessage(data.error || 'Invalid or expired reset link', 'error');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify token if it's in URL
  React.useEffect(() => {
    console.log('useEffect triggered:', { token, email });
    if (token && email) {
      handleVerifyToken();
    }
  }, [token, email]);

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
              {step === 'request' ? 'Forgot Password' : 'Reset Password'}
            </h2>
            <p style={{ color: '#d1c4e9' }}>
              {step === 'request' 
                ? 'Enter your email to receive a reset link' 
                : 'Enter your new password'
              }
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: messageType === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                             messageType === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                             'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${messageType === 'error' ? '#ef4444' : 
                                  messageType === 'success' ? '#22c55e' : '#3b82f6'}`,
              color: messageType === 'error' ? '#fca5a5' : 
                     messageType === 'success' ? '#86efac' : '#93c5fd'
            }}>
              {messageType === 'info' && message.includes('Reset URL:') ? (
                <div>
                  <div style={{ marginBottom: '8px', fontWeight: '600' }}>Reset URL:</div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <a 
                      href={message.replace('Reset URL: ', '')}
                      style={{
                        color: '#c084fc',
                        textDecoration: 'underline',
                        wordBreak: 'break-all',
                        flex: 1
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {message.replace('Reset URL: ', '')}
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.replace('Reset URL: ', ''));
                        showMessage('Reset URL copied to clipboard!', 'success');
                      }}
                      style={{
                        background: 'rgba(192, 132, 252, 0.2)',
                        border: '1px solid #c084fc',
                        color: '#c084fc',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : (
                message
              )}
            </div>
          )}

          {/* Request Reset Form */}
          {step === 'request' && (
            <form onSubmit={handleRequestReset}>
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#fff',
                  fontWeight: '600'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
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
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
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
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div style={{ 
            marginTop: '32px',
            textAlign: 'center',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#c084fc',
                fontSize: '1rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 