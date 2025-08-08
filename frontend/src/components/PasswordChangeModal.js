import React, { useState } from 'react';
import { showToast } from './Toast';
import config from '../config';
import '../components/ModernUI.css';
import './PasswordChangeModal.css';

const PasswordChangeModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      showToast('Current password is required', 'error');
      return false;
    }
    if (!formData.newPassword.trim()) {
      showToast('New password is required', 'error');
      return false;
    }
    if (formData.newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      showToast('New password must be different from current password', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const email = localStorage.getItem('user_email');
      const response = await fetch(`${config.BACKEND_URL}/change_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Password changed successfully!', 'success');
        onClose();
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showToast(data.error || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Error changing password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPassword({
      current: false,
      new: false,
      confirm: false
    });
    onClose();
  };

  if (!isOpen) return null;

    return (
    <div className="password-modal-overlay">
      <div className="glass-card password-modal-container">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="password-modal-close-btn"
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="password-modal-header-icon">
            🔒
          </div>
          <h2 className="password-modal-title">
            Change Password
          </h2>
          <p className="password-modal-subtitle">
            Enter your current password and choose a new secure password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Current Password */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#fff',
              fontWeight: '500',
              fontSize: '0.95rem'
            }}>
              Current Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Enter your current password"
                className="password-input"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="password-toggle-btn"
              >
                {showPassword.current ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#fff',
              fontWeight: '500',
              fontSize: '0.95rem'
            }}>
              New Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Enter your new password"
                className="password-input"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="password-toggle-btn"
              >
                {showPassword.new ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div className="password-help-text">
              Password must be at least 6 characters long
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#fff',
              fontWeight: '500',
              fontSize: '0.95rem'
            }}>
              Confirm New Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your new password"
                className="password-input"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="password-toggle-btn"
              >
                {showPassword.confirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <div className="password-error-text">
                Passwords do not match
              </div>
            )}
          </div>

                    {/* Action Buttons */}
          <div className="password-modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="password-modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="password-modal-submit-btn"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal; 