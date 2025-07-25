import React, { useState, useRef } from 'react';
import './ModernUI.css';
import MicWaveform from './MicWaveform';

const StartInterviewPage = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState([]); // {speaker: 'user'|'ai', text: string}
  const [aiResponse, setAiResponse] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Start/stop mic
  const handleStartSpeaking = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setListening(true);
    let finalTranscript = '';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setAiResponse('');
      setTranscript((prev) => [
        ...prev.filter((t) => t.speaker !== 'user-interim'),
        { speaker: 'user-interim', text: interim }
      ]);
    };
    recognition.onend = () => {
      setListening(false);
      setTranscript((prev) => [
        ...prev.filter((t) => t.speaker !== 'user-interim'),
        ...(finalTranscript ? [{ speaker: 'user', text: finalTranscript }] : [])
      ]);
      if (finalTranscript) {
        // Simulate AI response
        setTimeout(() => {
          const aiText = 'This is an AI response to: ' + finalTranscript;
          setAiResponse(aiText);
          setTranscript((prev) => [...prev, { speaker: 'ai', text: aiText }]);
        }, 1200);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.start();
  };

  // TTS playback
  const handlePlayTTS = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('TTS not supported in this browser.');
      return;
    }
    setSpeaking(true);
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.onend = () => setSpeaking(false);
    synthRef.current.speak(utter);
  };

  // End interview (save to localStorage)
  const handleEndInterview = () => {
    if (transcript.length === 0) {
      alert('No transcript to save!');
      return;
    }
    // Calculate duration (mocked for now)
    const start = new Date();
    const duration = `${Math.floor(Math.random()*10)+5}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}`;
    // Calculate score (mocked)
    const score = (Math.random()*1.5+3.5).toFixed(1);
    // Build Q&A logs
    let logs = [];
    let lastQ = null;
    transcript.forEach((t) => {
      if (t.speaker === 'user') lastQ = { q: t.text };
      if (t.speaker === 'ai' && lastQ) {
        logs.push({
          time: `${(logs.length+1).toString().padStart(2,'0')}:00`,
          q: lastQ.q,
          a: t.text
        });
        lastQ = null;
      }
    });
    const session = {
      id: Date.now(),
      date: new Date().toISOString().slice(0,10),
      duration,
      score,
      logs
    };
    let sessions = JSON.parse(localStorage.getItem('interview_sessions') || '[]');
    sessions.unshift(session);
    localStorage.setItem('interview_sessions', JSON.stringify(sessions));
    alert('Interview session saved!');
    setTranscript([]);
    setAiResponse('');
  };

  return (
    <div className="modern-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: 1200, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.27)', borderRadius: 24, overflow: 'hidden' }}>
        {/* Main Interaction Area */}
        <main style={{ flex: 1, background: 'rgba(34,34,68,0.70)', padding: '3.5rem 2.5rem', display: 'flex', gap: 36 }}>
          {/* Center Mic Access Box */}
          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 34, boxShadow: '0 2px 8px #c084fc22', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 320 }}>
              <MicWaveform listening={listening} />
              <button className="modern-btn" style={{ marginTop: 20, minWidth: 170, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 10 }} onClick={handleStartSpeaking} disabled={listening}>
                <span role="img" aria-label="mic">🎤</span> {listening ? 'Listening...' : 'Start Speaking'}
              </button>
              <button className="modern-btn" style={{ marginTop: 16, background: '#c084fc', color: '#fff', minWidth: 170 }} onClick={handleEndInterview}>
                End Interview
              </button>
            </div>
            {/* AI Response Bubble */}
            {aiResponse && (
              <div style={{ marginTop: 18, padding: '18px 24px', background: 'rgba(192,132,252,0.12)', borderRadius: 16, color: '#fff', maxWidth: 400, alignSelf: 'center', boxShadow: '0 2px 8px #c084fc22', position: 'relative' }}>
                <div style={{ fontWeight: 600, marginBottom: 7, color: '#c084fc' }}>AI Response</div>
                <div style={{ fontSize: '1.07rem', marginBottom: 7 }}>{aiResponse}</div>
                <button className="modern-btn" style={{ fontSize: 15, padding: '2px 18px', background: '#6ee7b7', color: '#1b183a', marginTop: 2 }} onClick={() => handlePlayTTS(aiResponse)} disabled={speaking}>
                  🔊 {speaking ? 'Playing...' : 'Play TTS'}
                </button>
              </div>
            )}
          </section>
          {/* Live Transcript Panel (Right) */}
          <aside style={{ width: 340, background: 'rgba(34,34,68,0.85)', borderRadius: 16, padding: '28px 18px', color: '#fff', boxShadow: '0 2px 8px #c084fc22', maxHeight: 480, overflowY: 'auto', alignSelf: 'flex-start' }}>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#c084fc', marginBottom: 14 }}>Live Transcript</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {transcript.length === 0 && <div style={{ color: '#aaa' }}>No transcript yet.</div>}
              {transcript.map((t, i) => t.speaker !== 'user-interim' && (
                <div key={i} style={{ alignSelf: t.speaker === 'user' ? 'flex-end' : 'flex-start', background: t.speaker === 'user' ? 'rgba(110,231,183,0.15)' : 'rgba(192,132,252,0.14)', borderRadius: 12, padding: '7px 14px', color: t.speaker === 'user' ? '#6ee7b7' : '#c084fc', fontWeight: 500, maxWidth: 260 }}>
                  {t.speaker === 'user' ? 'You: ' : 'AI: '}{t.text}
                </div>
              ))}
              {/* Show interim transcript live */}
              {transcript.find((t) => t.speaker === 'user-interim') && (
                <div style={{ alignSelf: 'flex-end', color: '#fff', fontStyle: 'italic', opacity: 0.7 }}>
                  {transcript.find((t) => t.speaker === 'user-interim').text}
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default StartInterviewPage;
