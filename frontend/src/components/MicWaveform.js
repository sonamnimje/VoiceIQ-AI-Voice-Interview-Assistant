import React, { useRef, useEffect } from 'react';

// Simple animated waveform using canvas
export default function MicWaveform({ listening }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let phase = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = listening ? '#c084fc' : '#aaa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 2) {
        const y = canvas.height / 2 + Math.sin((x + phase) * 0.07) * (listening ? 18 : 7);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      phase += listening ? 3 : 1;
      animationId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [listening]);
  return (
    <canvas
      ref={canvasRef}
      width={90}
      height={48}
      style={{ display: 'block', margin: '0 auto', background: 'transparent' }}
      aria-label={listening ? 'Listening waveform' : 'Mic idle waveform'}
    />
  );
}
