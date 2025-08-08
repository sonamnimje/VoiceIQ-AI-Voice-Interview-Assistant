import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

let toastRoot = null;
function ensureToastRoot() {
  if (!toastRoot) {
    toastRoot = document.getElementById('toast-root');
    if (!toastRoot) {
      toastRoot = document.createElement('div');
      toastRoot.id = 'toast-root';
      toastRoot.style.position = 'fixed';
      toastRoot.style.top = '24px';
      toastRoot.style.right = '24px';
      toastRoot.style.zIndex = 9999;
      toastRoot.style.display = 'flex';
      toastRoot.style.flexDirection = 'column';
      toastRoot.style.gap = '12px';
      document.body.appendChild(toastRoot);
    }
  }
}

const toastStyles = {
  base: {
    minWidth: 240,
    maxWidth: 340,
    background: '#fff',
    color: '#222244',
    borderRadius: 12,
    boxShadow: '0 4px 24px 0 rgba(139,92,246,0.18)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    fontSize: 16,
    fontWeight: 500,
    animation: 'toast-in 0.4s cubic-bezier(.4,0,.2,1)',
    position: 'relative',
    cursor: 'pointer',
  },
  success: { borderLeft: '5px solid #34d399' },
  error: { borderLeft: '5px solid #f87171' },
  info: { borderLeft: '5px solid #a78bfa' },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 10,
    background: 'none',
    border: 'none',
    color: '#a78bfa',
    fontSize: 18,
    cursor: 'pointer',
  },
};

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div style={{ ...toastStyles.base, ...toastStyles[type] }}>
      <span style={{ fontSize: 22 }}>
        {type === 'success' && '✅'}
        {type === 'error' && '❌'}
        {type === 'info' && 'ℹ️'}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      <button style={toastStyles.closeBtn} onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}

export function showToast(message, type = 'info') {
  ensureToastRoot();
  const toastDiv = document.createElement('div');
  toastRoot.appendChild(toastDiv);
  function remove() {
    if (toastDiv.parentNode) toastDiv.parentNode.removeChild(toastDiv);
  }
  ReactDOM.render(
    <Toast message={message} type={type} onClose={remove} />, toastDiv
  );
}

export default Toast;

// Add animation to global style if not present
if (!document.getElementById('toast-anim-style')) {
  const style = document.createElement('style');
  style.id = 'toast-anim-style';
  style.innerHTML = `
  @keyframes toast-in {
    0% { opacity: 0; transform: translateY(-30px) scale(0.95); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  `;
  document.head.appendChild(style);
} 