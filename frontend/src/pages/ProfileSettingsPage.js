import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernPopup from '../components/ModernPopup';
import PasswordChangeModal from '../components/PasswordChangeModal';
import DataExportModal from '../components/DataExportModal';
import { showToast } from '../components/Toast';
import config from '../config';
import '../components/ModernUI.css';

const ProfileSettingsPage = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: [],
    experience: '',
    education: '',
    linkedin: '',
    github: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDataExportModal, setShowDataExportModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const email = localStorage.getItem('user_email') || 'user@email.com';
      
      // Fetch user data from backend
      const response = await fetch(`${config.BACKEND_URL}/api/profile?email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        // Use default data if backend is not available
        setDefaultUserData();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setDefaultUserData();
    } finally {
      setLoading(false);
    }
  };

  const setDefaultUserData = () => {
    setUserData({
      name: 'John Doe',
      email: localStorage.getItem('user_email') || 'user@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      bio: 'Passionate software engineer with 5+ years of experience in full-stack development.',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      experience: '5+ years',
      education: 'Bachelor of Science in Computer Science',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe'
    });
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillsChange = (skillsString) => {
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill);
    setUserData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const saveProfile = async () => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          email: localStorage.getItem('user_email') || 'user@email.com'
        })
      });

      if (response.ok) {
        showToast('Profile updated successfully!', 'success');
        setIsEditing(false);
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Error saving profile', 'error');
    }
  };

  const handleDeleteAccount = () => {
    setPopupConfig({
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      type: 'error',
      actions: [
        <button 
          key="cancel" 
          onClick={() => setShowPopup(false)}
          style={{
            background: 'linear-gradient(90deg, #6b7280 0%, #6b728080 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: '80px',
            boxShadow: '0 4px 12px #6b728040'
          }}
        >
          Cancel
        </button>,
        <button 
          key="delete" 
          onClick={() => {
            setShowPopup(false);
            showToast('Account deletion feature coming soon', 'info');
          }}
          style={{
            background: 'linear-gradient(90deg, #ef4444 0%, #ef444480 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: '80px',
            boxShadow: '0 4px 12px #ef444440'
          }}
        >
          Delete Account
        </button>
      ]
    });
    setShowPopup(true);
  };

  if (loading) {
    return (
      <div className="modern-bg" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px', maxWidth: '400px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
            <h2 style={{ color: '#c084fc', marginBottom: '10px' }}>Loading Profile</h2>
            <p style={{ color: '#d1c4e9' }}>Fetching your profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-bg" style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px',
          background: 'rgba(34,34,68,0.8)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(192,132,252,0.2)',
          backdropFilter: 'blur(20px)',
          '@media (max-width: 768px)': {
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'center'
          }
        }}>
          <div>
            <h1 style={{ color: '#c084fc', margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
              👤 Profile Settings
            </h1>
            <p style={{ color: '#d1c4e9', margin: '8px 0 0 0', fontSize: '1.1rem' }}>
              Manage your account and personal information
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            '@media (max-width: 768px)': {
              flexDirection: 'column',
              width: '100%'
            }
          }}>
            <button 
              className="modern-btn"
              onClick={() => navigate('/dashboard')}
              style={{ 
                padding: '12px 24px', 
                fontSize: '1rem',
                '@media (max-width: 768px)': {
                  width: '100%'
                }
              }}
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Main Profile Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 2fr', 
          gap: '32px',
          '@media (max-width: 1024px)': {
            gridTemplateColumns: '1fr',
            gap: '24px'
          }
        }}>
          {/* Left Column: Profile Picture & Account Actions */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            '@media (max-width: 1024px)': {
              maxWidth: '500px',
              margin: '0 auto',
              width: '100%'
            }
          }}>
            {/* Profile Picture & Basic Info Card */}
            <div className="glass-card" style={{ 
              height: 'fit-content', 
              padding: '32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              '@media (max-width: 768px)': {
                padding: '24px'
              }
            }}>
              {/* Profile Picture */}
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c084fc 0%, #6ee7b7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '3rem',
                color: '#1b183a',
                fontWeight: 'bold',
                boxShadow: '0 8px 32px rgba(192, 132, 252, 0.3)',
                '@media (max-width: 768px)': {
                  width: '100px',
                  height: '100px',
                  fontSize: '2.5rem'
                }
              }}>
                {userData.name.charAt(0).toUpperCase()}
              </div>
              
              <h2 style={{ 
                color: '#ffffff', 
                margin: '0 0 8px 0', 
                fontSize: '1.5rem', 
                fontWeight: '600',
                '@media (max-width: 768px)': {
                  fontSize: '1.3rem'
                }
              }}>
                {userData.name}
              </h2>
              <p style={{ 
                color: '#d1c4e9', 
                margin: '0 0 16px 0', 
                fontSize: '1rem',
                '@media (max-width: 768px)': {
                  fontSize: '0.9rem'
                }
              }}>
                {userData.role || 'User'}
              </p>
              
              {/* Quick Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px', 
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div>
                  <div style={{ 
                    color: '#c084fc', 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    '@media (max-width: 768px)': {
                      fontSize: '1.3rem'
                    }
                  }}>
                    {userData.skills.length}
                  </div>
                  <div style={{ 
                    color: '#a3a3a3', 
                    fontSize: '0.9rem',
                    '@media (max-width: 768px)': {
                      fontSize: '0.8rem'
                    }
                  }}>Skills</div>
                </div>
                <div>
                  <div style={{ 
                    color: '#6ee7b7', 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    '@media (max-width: 768px)': {
                      fontSize: '1.3rem'
                    }
                  }}>
                    {userData.experience}
                  </div>
                  <div style={{ 
                    color: '#a3a3a3', 
                    fontSize: '0.9rem',
                    '@media (max-width: 768px)': {
                      fontSize: '0.8rem'
                    }
                  }}>Experience</div>
                </div>
              </div>
            </div>

            {/* Account Actions Card */}
            <div className="glass-card" style={{ 
              padding: '24px',
              '@media (max-width: 768px)': {
                padding: '20px'
              }
            }}>
              <h3 style={{ 
                color: '#c084fc', 
                marginBottom: '20px', 
                fontSize: '1.3rem', 
                fontWeight: '600',
                textAlign: 'center',
                '@media (max-width: 768px)': {
                  fontSize: '1.2rem',
                  marginBottom: '16px'
                }
              }}>
                Account Actions
              </h3>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px'
              }}>
                <button 
                  className="modern-btn"
                  onClick={() => setShowPasswordModal(true)}
                  style={{ 
                    padding: '14px 20px', 
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    '@media (max-width: 768px)': {
                      padding: '12px 16px',
                      fontSize: '0.9rem'
                    }
                  }}
                >
                  🔒 Change Password
                </button>
                <button 
                  className="modern-btn"
                  onClick={() => setShowDataExportModal(true)}
                  style={{ 
                    padding: '14px 20px', 
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    '@media (max-width: 768px)': {
                      padding: '12px 16px',
                      fontSize: '0.9rem'
                    }
                  }}
                >
                  📥 Export Data
                </button>
                <button 
                  className="modern-btn"
                  onClick={handleDeleteAccount}
                  style={{ 
                    background: 'linear-gradient(90deg, #ef4444 0%, #ef444480 100%)',
                    padding: '14px 20px',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    '@media (max-width: 768px)': {
                      padding: '12px 16px',
                      fontSize: '0.9rem'
                    }
                  }}
                >
                  🗑️ Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Profile Form Card */}
          <div className="glass-card" style={{ 
            padding: '32px',
            '@media (max-width: 768px)': {
              padding: '24px'
            }
          }}>
            {/* Form Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '32px',
              paddingBottom: '20px',
              borderBottom: '1px solid rgba(192,132,252,0.2)',
              '@media (max-width: 768px)': {
                flexDirection: 'column',
                gap: '16px',
                alignItems: 'flex-start'
              }
            }}>
              <h3 style={{ 
                color: '#c084fc', 
                margin: 0, 
                fontSize: '1.8rem', 
                fontWeight: '600',
                '@media (max-width: 768px)': {
                  fontSize: '1.5rem'
                }
              }}>
                Personal Information
              </h3>
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                '@media (max-width: 768px)': {
                  width: '100%',
                  justifyContent: 'space-between'
                }
              }}>
                {isEditing ? (
                  <>
                    <button 
                      className="modern-btn"
                      onClick={saveProfile}
                      style={{ 
                        padding: '10px 20px', 
                        fontSize: '0.9rem',
                        '@media (max-width: 768px)': {
                          padding: '8px 16px',
                          fontSize: '0.8rem'
                        }
                      }}
                    >
                      💾 Save Changes
                    </button>
                    <button 
                      className="modern-btn"
                      onClick={() => {
                        setIsEditing(false);
                        loadUserData();
                      }}
                      style={{ 
                        background: 'linear-gradient(90deg, #6b7280 0%, #6b728080 100%)',
                        padding: '10px 20px',
                        fontSize: '0.9rem',
                        '@media (max-width: 768px)': {
                          padding: '8px 16px',
                          fontSize: '0.8rem'
                        }
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    className="modern-btn"
                    onClick={() => setIsEditing(true)}
                    style={{ 
                      padding: '10px 20px', 
                      fontSize: '0.9rem',
                      '@media (max-width: 768px)': {
                        padding: '8px 16px',
                        fontSize: '0.8rem'
                      }
                    }}
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Basic Information Section */}
              <div>
                <h4 style={{ 
                  color: '#ffffff', 
                  margin: '0 0 20px 0', 
                  fontSize: '1.2rem', 
                  fontWeight: '600',
                  '@media (max-width: 768px)': {
                    fontSize: '1.1rem',
                    marginBottom: '16px'
                  }
                }}>
                  Basic Information
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '20px',
                  '@media (max-width: 768px)': {
                    gridTemplateColumns: '1fr',
                    gap: '16px'
                  }
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={userData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(192,132,252,0.3)',
                        background: isEditing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '16px',
                        outline: 'none',
                        opacity: isEditing ? 1 : 0.7,
                        transition: 'all 0.3s ease',
                        '@media (max-width: 768px)': {
                          fontSize: '14px',
                          padding: '10px 14px'
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={userData.email}
                      disabled={true}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(192,132,252,0.3)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#aaa',
                        fontSize: '16px',
                        outline: 'none',
                        opacity: 0.7,
                        '@media (max-width: 768px)': {
                          fontSize: '14px',
                          padding: '10px 14px'
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(192,132,252,0.3)',
                        background: isEditing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '16px',
                        outline: 'none',
                        opacity: isEditing ? 1 : 0.7,
                        transition: 'all 0.3s ease',
                        '@media (max-width: 768px)': {
                          fontSize: '14px',
                          padding: '10px 14px'
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={userData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(192,132,252,0.3)',
                        background: isEditing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '16px',
                        outline: 'none',
                        opacity: isEditing ? 1 : 0.7,
                        transition: 'all 0.3s ease',
                        '@media (max-width: 768px)': {
                          fontSize: '14px',
                          padding: '10px 14px'
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div>
                <h4 style={{ 
                  color: '#ffffff', 
                  margin: '0 0 20px 0', 
                  fontSize: '1.2rem', 
                  fontWeight: '600',
                  '@media (max-width: 768px)': {
                    fontSize: '1.1rem',
                    marginBottom: '16px'
                  }
                }}>
                  About Me
                </h4>
                <textarea
                  value={userData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(192,132,252,0.3)',
                    background: isEditing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                    opacity: isEditing ? 1 : 0.7,
                    resize: 'vertical',
                    transition: 'all 0.3s ease',
                    '@media (max-width: 768px)': {
                      fontSize: '14px',
                      padding: '10px 14px'
                    }
                  }}
                />
              </div>

              {/* Skills Section */}
              <div>
                <h4 style={{ 
                  color: '#ffffff', 
                  margin: '0 0 20px 0', 
                  fontSize: '1.2rem', 
                  fontWeight: '600',
                  '@media (max-width: 768px)': {
                    fontSize: '1.1rem',
                    marginBottom: '16px'
                  }
                }}>
                  Skills
                </h4>
                <input
                  type="text"
                  value={userData.skills.join(', ')}
                  onChange={(e) => handleSkillsChange(e.target.value)}
                  disabled={!isEditing}
                  placeholder="JavaScript, React, Node.js, Python..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(192,132,252,0.3)',
                    background: isEditing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                    opacity: isEditing ? 1 : 0.7,
                    transition: 'all 0.3s ease',
                    '@media (max-width: 768px)': {
                      fontSize: '14px',
                      padding: '10px 14px'
                    }
                  }}
                />
                {userData.skills.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px', 
                    marginTop: '12px' 
                  }}>
                    {userData.skills.map((skill, index) => (
                      <span key={index} style={{
                        background: 'rgba(192,132,252,0.2)',
                        color: '#c084fc',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(192,132,252,0.3)',
                        '@media (max-width: 768px)': {
                          fontSize: '0.8rem',
                          padding: '3px 10px'
                        }
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Professional Information */}
              <div>
                <h4 style={{ 
                  color: '#ffffff', 
                  margin: '0 0 20px 0', 
                  fontSize: '1.2rem', 
                  fontWeight: '600',
                  '@media (max-width: 768px)': {
                    fontSize: '1.1rem',
                    marginBottom: '16px'
                  }
                }}>
                  Professional Information
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '20px',
                  '@media (max-width: 768px)': {
                    gridTemplateColumns: '1fr',
                    gap: '16px'
                  }
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      Experience
                    </label>
                    <input
                      type="text"
                      value={userData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., 5+ years"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(192,132,252,0.3)',
                        background: isEditing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '16px',
                        outline: 'none',
                        opacity: isEditing ? 1 : 0.7,
                        transition: 'all 0.3s ease',
                        '@media (max-width: 768px)': {
                          fontSize: '14px',
                          padding: '10px 14px'
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      Education
                    </label>
                    <input
                      type="text"
                      value={userData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Bachelor's Degree"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(192,132,252,0.3)',
                        background: isEditing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '16px',
                        outline: 'none',
                        opacity: isEditing ? 1 : 0.7,
                        transition: 'all 0.3s ease',
                        '@media (max-width: 768px)': {
                          fontSize: '14px',
                          padding: '10px 14px'
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h4 style={{ 
                  color: '#ffffff', 
                  margin: '0 0 20px 0', 
                  fontSize: '1.2rem', 
                  fontWeight: '600',
                  '@media (max-width: 768px)': {
                    fontSize: '1.1rem',
                    marginBottom: '16px'
                  }
                }}>
                  Social Links
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '20px',
                  '@media (max-width: 768px)': {
                    gridTemplateColumns: '1fr',
                    gap: '16px'
                  }
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={userData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      disabled={!isEditing}
                      placeholder="linkedin.com/in/username"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(192,132,252,0.3)',
                        background: isEditing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '16px',
                        outline: 'none',
                        opacity: isEditing ? 1 : 0.7,
                        transition: 'all 0.3s ease',
                        '@media (max-width: 768px)': {
                          fontSize: '14px',
                          padding: '10px 14px'
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#fff',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      GitHub Profile
                    </label>
                    <input
                      type="url"
                      value={userData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      disabled={!isEditing}
                      placeholder="github.com/username"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(192,132,252,0.3)',
                        background: isEditing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '16px',
                        outline: 'none',
                        opacity: isEditing ? 1 : 0.7,
                        transition: 'all 0.3s ease',
                        '@media (max-width: 768px)': {
                          fontSize: '14px',
                          padding: '10px 14px'
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
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

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Data Export Modal */}
      <DataExportModal
        isOpen={showDataExportModal}
        onClose={() => setShowDataExportModal(false)}
      />
    </div>
  );
};

export default ProfileSettingsPage;