import React, { useState } from 'react';
import './ModernUI.css';

// Load sessions from localStorage
function getSessions() {
  try {
    return JSON.parse(localStorage.getItem('interview_sessions')) || [];
  } catch {
    return [];
  }
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

const TranscriptPage = () => {
  const [sessions, setSessions] = useState(getSessions());
  const [selected, setSelected] = useState(getSessions()[0] || null);

  // Reload sessions if window regains focus (e.g., after saving new interview)
  React.useEffect(() => {
    const reload = () => {
      const fresh = getSessions();
      setSessions(fresh);
      if (!fresh.length) setSelected(null);
      else if (!fresh.find(s => selected && s.id === selected.id)) setSelected(fresh[0]);
    };
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, [selected]);

  const handleDownload = (type) => {
    if (!selected) return;
    if (type === 'pdf') {
      import('jspdf').then(jsPDFModule => {
        const jsPDF = jsPDFModule.default;
        const doc = new jsPDF();
        doc.setFontSize(15);
        doc.text('Interview Transcript', 14, 18);
        doc.setFontSize(11);
        doc.text(`Date: ${selected.date}`, 14, 28);
        doc.text(`Duration: ${selected.duration}  |  Score: ${selected.score}`, 14, 34);
        let y = 44;
        selected.logs.forEach((log, i) => {
          doc.setFont(undefined, 'bold');
          doc.text(`${log.time}  Q:`, 14, y);
          doc.setFont(undefined, 'normal');
          doc.text(log.q, 32, y);
          y += 8;
          doc.setFont(undefined, 'bold');
          doc.text('A:', 22, y);
          doc.setFont(undefined, 'normal');
          doc.text(log.a, 32, y);
          y += 12;
          if (y > 270) { doc.addPage(); y = 20; }
        });
        doc.save(`transcript_${selected.date}_${selected.id}.pdf`);
      });
    } else if (type === 'audio') {
      // Play transcript using browser TTS
      if (!window.speechSynthesis) {
        alert('Text-to-speech not supported in this browser.');
        return;
      }
      let utterances = [];
      selected.logs.forEach((log, i) => {
        utterances.push(new window.SpeechSynthesisUtterance(`Question: ${log.q}`));
        utterances.push(new window.SpeechSynthesisUtterance(`Answer: ${log.a}`));
      });
      // Chain utterances
      let idx = 0;
      function speakNext() {
        if (idx < utterances.length) {
          utterances[idx].onend = speakNext;
          window.speechSynthesis.speak(utterances[idx++]);
        }
      }
      speakNext();
      // Optionally, show a message for download fallback
      alert('Audio playback started using browser TTS. Downloadable audio export coming soon!');
    }
  }

  return (
    <div className="modern-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: 1100, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.27)', borderRadius: 24, overflow: 'hidden' }}>
        {/* Left: Session List */}
        <aside style={{ background: 'rgba(34,34,68,0.85)', color: '#fff', minWidth: 210, padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#c084fc', marginBottom: 20 }}>Past Sessions</div>
          {sessions.length === 0 ? (
            <div style={{ color: '#aaa', marginTop: 30, fontSize: 15 }}>No saved interviews yet.</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  borderRadius: 12,
                  padding: '12px 12px',
                  marginBottom: 7,
                  background: selected && selected.id === s.id ? 'rgba(192,132,252,0.18)' : 'rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  fontWeight: selected && selected.id === s.id ? 700 : 500,
                  color: selected && selected.id === s.id ? '#c084fc' : '#fff',
                  boxShadow: selected && selected.id === s.id ? '0 2px 8px #c084fc22' : undefined,
                }}
                onClick={() => setSelected(s)}
              >
                <div style={{ fontSize: '1.08rem' }}>{s.date}</div>
                <div style={{ fontSize: 13, color: '#a3e5fc', marginTop: 2 }}>Duration: {s.duration}</div>
                <div style={{ fontSize: 13, color: '#6ee7b7' }}>Score: {s.score}</div>
              </div>
            ))
          )}
        </aside>
        {/* Main: Transcript Viewer */}
        <main style={{ flex: 1, background: 'rgba(34,34,68,0.70)', padding: '3.5rem 2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontWeight: 700, fontSize: '1.3rem', color: '#c084fc' }}>Transcript Viewer</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="modern-btn" style={{ fontSize: 15, padding: '2px 16px' }} onClick={() => handleDownload('pdf')}>
                📄 Download PDF
              </button>
              <button className="modern-btn" style={{ fontSize: 15, padding: '2px 16px' }} onClick={() => handleDownload('audio')}>
                🔊 Download Audio
              </button>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px 16px', boxShadow: '0 2px 8px #c084fc22', minHeight: 220 }}>
            {(!selected || !selected.logs || selected.logs.length === 0) ? (
              <div style={{ color: '#aaa', textAlign: 'center', marginTop: 60, fontSize: 16 }}>
                No transcript to display.
              </div>
            ) : (
              selected.logs.map((log, i) => (
                <div key={i} style={{ marginBottom: 18, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ background: '#c084fc', color: '#fff', borderRadius: 8, padding: '4px 12px', minWidth: 56, textAlign: 'center', fontWeight: 600 }}>{log.time}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', marginBottom: 3 }}>Q: {log.q}</div>
                    <div style={{ color: '#d1c4e9' }}>A: {log.a}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TranscriptPage;
