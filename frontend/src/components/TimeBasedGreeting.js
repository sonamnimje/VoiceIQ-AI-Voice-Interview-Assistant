import React, { useState, useEffect } from 'react';
import './TimeBasedGreeting.css';

const TimeBasedGreeting = ({ userName, className = '', showEmoji = true, useTextWave = false }) => {
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeClass, setTimeClass] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = currentTime.getHours();
      let timeGreeting = '';
      let timeStyle = '';
      
      if (hour < 12) {
        timeGreeting = 'Good Morning';
        timeStyle = 'greeting-morning';
      } else if (hour < 17) {
        timeGreeting = 'Good Afternoon';
        timeStyle = 'greeting-afternoon';
      } else {
        timeGreeting = 'Good Evening';
        timeStyle = 'greeting-evening';
      }
      
      setGreeting(timeGreeting);
      setTimeClass(timeStyle);
    };

    updateGreeting();
    
    // Update every minute to keep the greeting current
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [currentTime]);

  return (
    <span className={`time-based-greeting ${timeClass} ${className}`}>
      {greeting}, {userName} {showEmoji && (
        useTextWave ? 
        <span className="greeting-wave" style={{ fontSize: '1.2em', display: 'inline-block', marginLeft: '8px' }}>~</span> :
        <span className="greeting-emoji" style={{ fontSize: '1.2em', display: 'inline-block', marginLeft: '8px' }}>👋</span>
      )}
    </span>
  );
};

export default TimeBasedGreeting; 