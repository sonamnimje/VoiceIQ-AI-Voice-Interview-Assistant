import React from 'react';

// InfoModal: Modern info dialog
function InfoModal({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div className="glass-card" style={{ minWidth: 320, maxWidth: 380, color: '#fff', textAlign: 'center', boxShadow: '0 8px 32px 0 rgba(139,92,246,0.18)' }}>
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 10 }}>{title}</div>
        <div style={{ color: '#d1c4e9', fontSize: 16, marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button className="modern-btn" style={{ minWidth: 90 }} onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

export default InfoModal; 