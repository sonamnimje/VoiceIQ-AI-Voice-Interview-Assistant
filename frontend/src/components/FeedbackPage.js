import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'chart.js/auto';

const dummyData = {
  overallScore: 8.2,
  categories: {
    Clarity: 7.5,
    Confidence: 8.5,
    Grammar: 8.0,
    Relevance: 8.8,
    Depth: 7.9,
  },
  suggestions: [
    'Speak a bit slower for clarity.',
    'Support answers with more examples.',
    'Work on filler words (um, uh, etc.).',
  ],
  transcript: [
    { time: '00:01', text: 'Tell me about yourself.', tag: 'good' },
    { time: '00:10', text: 'I am a software engineer...', tag: 'important' },
    { time: '00:30', text: 'What are your strengths?', tag: 'weak' },
    { time: '00:40', text: 'I am hardworking...', tag: 'good' },
  ],
  ttsFeedback: 'Great job overall! Focus on clarity and provide more detailed examples in your answers.'
};

function FeedbackPage() {
  const [data] = useState(dummyData);

  // Chart Data
  const chartData = {
    labels: Object.keys(data.categories),
    datasets: [
      {
        label: 'Category Scores',
        data: Object.values(data.categories),
        backgroundColor: [
          'rgba(52,211,153,0.7)',   // soft green
          'rgba(129,140,248,0.7)',  // soft indigo
          'rgba(253,224,71,0.7)',   // soft yellow
          'rgba(244,114,182,0.7)',  // soft pink
          'rgba(139,92,246,0.7)',   // soft purple
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('AI Interview Feedback Report', 10, 10);
    doc.text(`Overall Score: ${data.overallScore}/10`, 10, 20);
    doc.text('Category Scores:', 10, 30);
    let y = 40;
    Object.entries(data.categories).forEach(([cat, score]) => {
      doc.text(`${cat}: ${score}`, 10, y);
      y += 10;
    });
    doc.text('Suggestions:', 10, y);
    y += 10;
    data.suggestions.forEach((s, idx) => {
      doc.text(`- ${s}`, 10, y + idx * 10);
    });
    doc.save('AI_Feedback_Report.pdf');
  };

  // Export to JSON
  const exportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AI_Feedback_Report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // TTS Feedback
  const speakFeedback = () => {
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(data.ttsFeedback);
      window.speechSynthesis.speak(utter);
    } else {
      alert('TTS not supported in this browser.');
    }
  };

  // Highlighted tags styling
  const tagColors = {
    important: 'rgba(253,224,71,0.55)',   // pastel yellow
    weak: 'rgba(244,114,182,0.55)',       // pastel pink
    good: 'rgba(129,199,132,0.55)',       // pastel green
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #222244 0%, #2a225c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, Arial, sans-serif' }}>
      <div style={{ maxWidth: 900, width: '100%', background: 'rgba(34,34,68,0.85)', borderRadius: 28, boxShadow: '0 8px 32px 0 rgba(139,92,246,0.18)', border: '1px solid #3a2e6e', padding: '0', margin: '40px 0', overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
        {/* Card Header with accent border */}
        <div style={{ borderLeft: '8px solid #a78bfa', background: 'linear-gradient(90deg, rgba(64,44,120,0.18) 60%, rgba(34,34,68,0.85) 100%)', padding: '2rem 2rem 1.5rem 2rem', boxShadow: '0 2px 8px #8b5cf622' }}>
          <h2 style={{ color: '#a78bfa', fontWeight: 700, marginBottom: 8, fontSize: 28, letterSpacing: 0.5 }}>AI Interview Feedback</h2>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#fff' }}>Overall Score: <span style={{ color: '#34d399' }}>{data.overallScore}/10</span></div>
              <Bar data={chartData} options={{ scales: { y: { min: 0, max: 10 }, x: { ticks: { color: '#fff' } }, yAxes: [{ ticks: { color: '#fff' } }] } }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#a78bfa' }}>Personalized AI Suggestions:</div>
              <ul style={{ color: '#fff', marginBottom: 0, paddingLeft: 18 }}>
                {data.suggestions.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
              </ul>
              <button onClick={speakFeedback} style={{ margin: '14px 8px 0 0', padding: '7px 20px', background: '#a78bfa', color: '#222244', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #a78bfa22' }}>🔊 Voice Feedback</button>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '0 2rem 2rem 2rem' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#a78bfa', fontSize: 18 }}>Transcript (AI Highlights):</div>
            <div style={{ background: 'rgba(64,44,120,0.18)', borderRadius: 16, padding: 20, border: '1px solid #3a2e6e', boxShadow: '0 1px 8px #8b5cf611' }}>
              {data.transcript.map((item, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: tagColors[item.tag] || '#eee', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px #0001' }}>
                  <span style={{ fontWeight: 600, minWidth: 60, color: '#a78bfa' }}>{item.time}</span>
                  <span style={{ marginLeft: 16, color: '#fff', fontSize: 16 }}>{item.text}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: 0.5 }}>{item.tag.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <button onClick={exportPDF} style={{ padding: '10px 22px', background: '#a78bfa', color: '#222244', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #a78bfa22' }}>Export PDF</button>
            <button onClick={exportJSON} style={{ padding: '10px 22px', background: '#34d399', color: '#222244', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #34d39922' }}>Export JSON</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;
