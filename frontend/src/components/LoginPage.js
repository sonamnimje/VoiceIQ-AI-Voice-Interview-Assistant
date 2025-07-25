import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ModernUI.css';

const LoginPage = () => {
  const [userOrEmail, setUserOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userOrEmail, password }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="modern-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, borderRadius: 24, background: 'rgba(34,34,68,0.85)', padding: '2.5rem 2rem' }}>
        <h2 className="modern-title" style={{ textAlign: 'center', marginBottom: 14 }}>Welcome Back</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username or Email"
            value={userOrEmail}
            onChange={e => setUserOrEmail(e.target.value)}
            required
            style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: '1rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: '1rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.97rem', color: '#d1c4e9', marginBottom: 8 }}>
            <a href="#forgot" style={{ color: '#c084fc', textDecoration: 'none' }}>Forgot password?</a>
          </div>
          {error && (
            <div style={{ color: '#ff8a65', marginBottom: 10, textAlign: 'center', fontWeight: 500 }}>{error}</div>
          )}
          <button className="modern-btn" type="submit" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ textAlign: 'center', margin: '18px 0 8px', color: '#b0b0b0' }}>
          Don't have an account? <a href="/signup" style={{ color: '#c084fc' }}>Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;