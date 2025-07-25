import React from "react";
import "./ModernUI.css";

export default function Centerpiece() {
  return (
    <div className="modern-bg" style={{ minHeight: '50vh' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #c084fc 0%, #2a0845 100%)',
          boxShadow: '0 0 40px 8px #c084fc99, 0 0 0 10px rgba(255,255,255,0.07)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '3px solid rgba(255,255,255,0.14)',
          margin: '40px 0'
        }}>
          <span style={{ color: '#fff', fontSize: 36, fontWeight: 700, textShadow: '0 0 16px #fff8, 0 0 32px #c084fc' }}>★</span>
        </div>
      </div>
    </div>
  );
}
