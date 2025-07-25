import React, { useState, useEffect } from 'react';

const ProfileSettingsPage = () => {
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editProfile, setEditProfile] = useState({ ...profile });

  useEffect(() => {
    const userOrEmail = localStorage.getItem('user_email') || 'jonnyroria@gmail.com';
    fetch(`http://localhost:8000/profile?user_or_email=${encodeURIComponent(userOrEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setProfile({
            name: data.name || '',
            username: data.username || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || ''
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setEditProfile(profile);
  }, [profile]);

  const handleEditChange = (e) => {
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
  };

  const handleEditSave = () => {
    // You can add your update API call here
    setProfile(editProfile);
    setShowEdit(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgba(34,34,68,0.98)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#a78bfa', fontSize: 20 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'rgba(34,34,68,0.98)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'rgba(34,34,68,0.98)', borderRadius: 28, boxShadow: '0 8px 32px 0 rgba(139,92,246,0.18)', padding: '2.5rem 2rem', position: 'relative' }}>
        <h2 style={{ color: '#a78bfa', textAlign: 'center', marginBottom: 18, fontWeight: 700 }}>Profile</h2>
        <div style={{ color: '#fff', fontSize: 18, marginBottom: 18 }}>
          <div style={{ marginBottom: 10 }}><strong>Name:</strong> {profile.name}</div>
          <div style={{ marginBottom: 10 }}><strong>Username:</strong> {profile.username}</div>
          <div style={{ marginBottom: 10 }}><strong>Email:</strong> {profile.email}</div>
          <div style={{ marginBottom: 10 }}><strong>Number:</strong> {profile.phone}</div>
          <div style={{ marginBottom: 10 }}><strong>Address:</strong> {profile.address}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <button
            style={{ background: '#34d399', color: '#222244', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', marginRight: 8 }}
            onClick={() => setShowEdit(true)}
          >
            Edit
          </button>
          <button
            style={{ background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => alert('Logged out!')}
          >
            Logout
          </button>
        </div>

        {showEdit && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#222244', borderRadius: 16, padding: 32, minWidth: 320, color: '#fff', boxShadow: '0 8px 32px 0 rgba(139,92,246,0.18)'
            }}>
              <h3 style={{ color: '#a78bfa', marginBottom: 18 }}>Edit Profile</h3>
              <div style={{ marginBottom: 12 }}>
                <label>Name:</label>
                <input
                  name="name"
                  value={editProfile.name}
                  onChange={handleEditChange}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #a78bfa', marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Username:</label>
                <input
                  name="username"
                  value={editProfile.username}
                  onChange={handleEditChange}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #a78bfa', marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Email:</label>
                <input
                  name="email"
                  value={editProfile.email}
                  onChange={handleEditChange}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #a78bfa', marginTop: 4 }}
                  disabled
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Number:</label>
                <input
                  name="phone"
                  value={editProfile.phone}
                  onChange={handleEditChange}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #a78bfa', marginTop: 4 }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label>Address:</label>
                <input
                  name="address"
                  value={editProfile.address}
                  onChange={handleEditChange}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #a78bfa', marginTop: 4 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  style={{ background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', marginRight: 8 }}
                  onClick={handleEditSave}
                >
                  Save
                </button>
                <button
                  style={{ background: '#fff', color: '#222244', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileSettingsPage;