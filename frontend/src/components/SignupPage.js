import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ModernUI.css';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!name || !username || !gmail || !password) {
      setError('Please provide name, username, gmail, and password.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/add_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, gmail, email: gmail, password, phone, address })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Signup successful!');
        navigate('/login');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="modern-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, borderRadius: 24, background: 'rgba(34,34,68,0.85)', padding: '2.5rem 2rem' }}>
        <h2 className="modern-title" style={{ textAlign: 'center', marginBottom: 14 }}>Sign Up</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: '1rem' }}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: '1rem' }}
          />
          <input
            type="email"
            placeholder="Gmail"
            value={gmail}
            onChange={e => setGmail(e.target.value)}
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
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: '1rem' }}
          />
          <input
            type="text"
            placeholder="Address (optional)"
            value={address}
            onChange={e => setAddress(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: '1rem' }}
          />
          {error && (
            <div style={{ color: '#ff8a65', marginBottom: 10, textAlign: 'center', fontWeight: 500 }}>{error}</div>
          )}
          <button className="modern-btn" type="submit" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <div style={{ textAlign: 'center', margin: '18px 0 8px', color: '#b0b0b0' }}>
          Already have an account? <a href="/login" style={{ color: '#c084fc' }}>Login</a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;