import React, { useState, useEffect, useRef } from 'react';
import './AudioTestDebug.css';

const AudioTestDebug = () => {
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState([]);
  const [permissions, setPermissions] = useState({ audio: 'unknown', video: 'unknown' });
  const [errors, setErrors] = useState([]);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const streamRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const addError = (error) => {
    const message = error.message || error.toString();
    addLog(`ERROR: ${message}`, 'error');
    setErrors(prev => [...prev, { timestamp: new Date(), message }]);
  };

  useEffect(() => {
    addLog('Audio Test Debug Component Initialized');
    checkPermissions();
    enumerateDevices();
  }, []);

  const checkPermissions = async () => {
    try {
      addLog('Checking permissions...');
      
      // Check if permissions API is supported
      if (navigator.permissions) {
        try {
          const audioPermission = await navigator.permissions.query({ name: 'microphone' });
          setPermissions(prev => ({ ...prev, audio: audioPermission.state }));
          addLog(`Audio permission state: ${audioPermission.state}`);
          
          audioPermission.onchange = () => {
            setPermissions(prev => ({ ...prev, audio: audioPermission.state }));
            addLog(`Audio permission changed to: ${audioPermission.state}`);
          };
        } catch (permErr) {
          addLog(`Permissions API not fully supported: ${permErr.message}`, 'warning');
        }
      } else {
        addLog('Permissions API not supported', 'warning');
      }
    } catch (error) {
      addError(error);
    }
  };

  const enumerateDevices = async () => {
    try {
      addLog('Enumerating audio devices...');
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      addLog(`Found ${audioInputs.length} audio input devices`);
      audioInputs.forEach((device, index) => {
        addLog(`Device ${index + 1}: ${device.label || `Unknown Device ${device.deviceId.slice(0, 8)}`}`);
      });
      
      setAudioDevices(audioInputs);
      
      if (audioInputs.length > 0) {
        setSelectedDevice(audioInputs[0].deviceId);
        addLog(`Auto-selected device: ${audioInputs[0].label || 'Default Device'}`);
      }
    } catch (error) {
      addError(error);
    }
  };

  const requestPermissions = async () => {
    try {
      addLog('Requesting microphone permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('Microphone permission granted');
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      // Re-enumerate devices to get labels
      await enumerateDevices();
      
      setPermissions(prev => ({ ...prev, audio: 'granted' }));
    } catch (error) {
      addError(error);
      setPermissions(prev => ({ ...prev, audio: 'denied' }));
    }
  };

  const startAudioTest = async () => {
    if (!selectedDevice) {
      addLog('No device selected', 'error');
      return;
    }

    try {
      setIsTesting(true);
      setErrors([]);
      addLog(`Starting audio test with device: ${selectedDevice}`);
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      addLog(`Audio context created, state: ${audioContextRef.current.state}`);
      
      // Resume if suspended
      if (audioContextRef.current.state === 'suspended') {
        addLog('Resuming audio context...');
        await audioContextRef.current.resume();
        addLog(`Audio context resumed, state: ${audioContextRef.current.state}`);
      }
      
      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      addLog('Audio analyser created');
      
      // Get audio stream with multiple fallback attempts
      let stream;
      let streamMethod = '';
      
      try {
        addLog('Attempting to get audio stream with exact device...');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedDevice } }
        });
        streamMethod = 'exact device';
        addLog('Audio stream obtained with exact device match');
      } catch (exactErr) {
        addLog(`Exact device failed: ${exactErr.message}`, 'warning');
        try {
          addLog('Attempting to get audio stream with preferred device...');
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: selectedDevice }
          });
          streamMethod = 'preferred device';
          addLog('Audio stream obtained with preferred device');
        } catch (preferredErr) {
          addLog(`Preferred device failed: ${preferredErr.message}`, 'warning');
          try {
            addLog('Attempting to get audio stream with default device...');
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamMethod = 'default device';
            addLog('Audio stream obtained with default device');
          } catch (defaultErr) {
            addLog(`Default device failed: ${defaultErr.message}`, 'error');
            throw new Error(`All audio stream attempts failed. Last error: ${defaultErr.message}`);
          }
        }
      }
      
      streamRef.current = stream;
      addLog(`Stream obtained using: ${streamMethod}`);
      addLog(`Stream tracks: ${stream.getTracks().length}`);
      stream.getTracks().forEach((track, index) => {
        addLog(`Track ${index}: ${track.kind}, enabled: ${track.enabled}, muted: ${track.muted}`);
      });
      
      // Create media stream source
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      addLog('Microphone connected to analyser');
      
      // Start monitoring with more detailed logging
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      let frameCount = 0;
      
      const updateAudioLevel = () => {
        if (!isTesting) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        frameCount++;
        
        // Log significant audio activity or every 100 frames
        if (average > 10 || frameCount % 100 === 0) {
          addLog(`Frame ${frameCount}: Audio level: ${Math.round((average / 255) * 100)}% (raw: ${average})`, 'info');
        }
        
        // Log if we're getting no audio for a while
        if (frameCount % 50 === 0 && average < 5) {
          addLog(`Warning: No audio detected for ${frameCount} frames`, 'warning');
        }
        
        requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      addLog('Audio monitoring started');
      
    } catch (error) {
      addError(error);
      setIsTesting(false);
    }
  };

  const stopAudioTest = () => {
    try {
      setIsTesting(false);
      setAudioLevel(0);
      
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
        microphoneRef.current = null;
        addLog('Microphone disconnected');
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          addLog(`Audio track stopped: ${track.kind}`);
        });
        streamRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        addLog('Audio context closed');
      }
      
      addLog('Audio test stopped');
    } catch (error) {
      addError(error);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setErrors([]);
  };

  const downloadLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join('\n');
    const element = document.createElement('a');
    const file = new Blob([logText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `audio_test_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="audio-test-debug">
      <div className="debug-header">
        <h2>🎤 Audio Test Debug</h2>
        <div className="debug-controls">
          <button onClick={clearLogs} className="debug-btn">
            🗑️ Clear Logs
          </button>
          <button onClick={downloadLogs} className="debug-btn">
            📥 Download Logs
          </button>
        </div>
      </div>

      <div className="debug-grid">
        {/* Device Selection */}
        <div className="debug-panel">
          <h3>📱 Device Information</h3>
          <div className="device-info">
            <div className="info-item">
              <label>Audio Permission:</label>
              <span className={`permission-${permissions.audio}`}>{permissions.audio}</span>
            </div>
            <div className="info-item">
              <label>Devices Found:</label>
              <span>{audioDevices.length}</span>
            </div>
            <div className="info-item">
              <label>Selected Device:</label>
              <span>{selectedDevice ? 'Device Selected' : 'No Device'}</span>
            </div>
          </div>
          
          <div className="device-actions">
            <button onClick={requestPermissions} className="action-btn">
              🔐 Request Permission
            </button>
            <button onClick={enumerateDevices} className="action-btn">
              🔄 Refresh Devices
            </button>
          </div>
          
          <div className="device-selector">
            <label>Select Audio Device:</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="device-select"
            >
              <option value="">Choose a device...</option>
              {audioDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Unknown Device ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audio Testing */}
        <div className="debug-panel">
          <h3>🎵 Audio Testing</h3>
          <div className="test-controls">
            {!isTesting ? (
              <button 
                onClick={startAudioTest}
                className="test-btn start"
                disabled={!selectedDevice}
              >
                🎵 Start Test
              </button>
            ) : (
              <button 
                onClick={stopAudioTest}
                className="test-btn stop"
              >
                ⏹️ Stop Test
              </button>
            )}
          </div>

          {isTesting && (
            <div className="audio-visualizer">
              <div className="audio-bar">
                <div 
                  className="audio-level"
                  style={{ width: `${(audioLevel / 255) * 100}%` }}
                ></div>
              </div>
              <div className="audio-stats">
                <span>Level: {Math.round((audioLevel / 255) * 100)}%</span>
                <span>Raw: {audioLevel}</span>
              </div>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="debug-panel logs-panel">
          <h3>📋 Debug Logs</h3>
          <div className="logs-container">
            {logs.length === 0 ? (
              <p className="no-logs">No logs yet. Start testing to see activity.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <span className="log-timestamp">[{log.timestamp}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="debug-panel errors-panel">
            <h3>❌ Errors</h3>
            <div className="errors-container">
              {errors.map((error, index) => (
                <div key={index} className="error-entry">
                  <span className="error-timestamp">[{error.timestamp.toLocaleTimeString()}]</span>
                  <span className="error-message">{error.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioTestDebug; 