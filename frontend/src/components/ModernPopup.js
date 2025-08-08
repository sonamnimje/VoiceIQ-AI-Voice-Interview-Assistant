import React, { useEffect } from 'react';
import './ModernAnimations.css';

const ModernPopup = ({ 
  open, 
  title, 
  message, 
  onClose, 
  type = 'info', // 'info', 'success', 'warning', 'error'
  autoClose = true,
  autoCloseDelay = 4000,
  showCloseButton = true,
  actions = null // Custom action buttons
}) => {
  useEffect(() => {
    if (open && autoClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [open, autoClose, autoCloseDelay, onClose]);

  if (!open) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info':
      default: return 'ℹ️';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return '#34d399';
      case 'warning': return '#fbbf24';
      case 'error': return '#f87171';
      case 'info':
      default: return '#a78bfa';
    }
  };

  return (
    <div 
      className="fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bounce-in"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: `2px solid ${getBorderColor()}40`,
          position: 'relative',
          color: '#ffffff'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '16px',
          borderBottom: `1px solid ${getBorderColor()}30`,
          paddingBottom: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>{getIcon()}</span>
          <div style={{ 
            fontWeight: '700', 
            fontSize: '18px', 
            color: '#ffffff',
            flex: 1
          }}>
            {title}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#a78bfa',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(167, 139, 250, 0.1)';
                e.target.style.color = '#c084fc';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = '#a78bfa';
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Message */}
        <div style={{ 
          color: '#d1c4e9', 
          fontSize: '16px', 
          lineHeight: '1.5',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          {message.split('\n').map((line, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              {line}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px'
        }}>
          {actions ? (
            actions
          ) : (
            <button
              onClick={onClose}
              style={{
                background: `linear-gradient(90deg, ${getBorderColor()} 0%, ${getBorderColor()}80 100%)`,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: '80px',
                boxShadow: `0 4px 12px ${getBorderColor()}40`
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 6px 20px ${getBorderColor()}60`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 4px 12px ${getBorderColor()}40`;
              }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Utility function to show popup programmatically
export const showModernPopup = (options) => {
  const popupDiv = document.createElement('div');
  popupDiv.id = 'modern-popup-container';
  document.body.appendChild(popupDiv);

  const cleanup = () => {
    if (popupDiv.parentNode) {
      popupDiv.parentNode.removeChild(popupDiv);
    }
  };

  const handleClose = () => {
    cleanup();
    if (options.onClose) options.onClose();
  };

  // Import React and ReactDOM dynamically
  const React = require('react');
  const ReactDOM = require('react-dom');

  ReactDOM.render(
    React.createElement(ModernPopup, {
      ...options,
      open: true,
      onClose: handleClose
    }),
    popupDiv
  );

  return cleanup;
};

export default ModernPopup; 