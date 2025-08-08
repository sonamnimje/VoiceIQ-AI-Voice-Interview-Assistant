import React, { useState, useEffect, useRef } from 'react';
import './AudioDiagnostic.css';

const AudioDiagnostic = () => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const streamRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    addLog('Audio Diagnostic Component Initialized');
    checkPermissions();
    enumerateDevices();
  }, []);

  const checkPermissions = async () => {
    try {
      addLog('Checking microphone permissions...');
      
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          setPermissionStatus(permission.state);
          addLog(`Permission status: ${permission.state}`);
          
          permission.onchange = () => {
            setPermissionStatus(permission.state);
            addLog(`Permission changed to: ${permission.state}`);
          };
        } catch (err) {
          addLog(`Permissions API error: ${err.message}`, 'warning');
        }
      } else {
        addLog('Permissions API not supported', 'warning');
      }
    } catch (error) {
      addLog(`Permission check failed: ${error.message}`, 'error');
    }
  };

  const enumerateDevices = async () => {
    try {
      addLog('Enumerating audio devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(d => d.kind === 'audioinput');
      
      setDevices(audioDevices);
      addLog(`Found ${audioDevices.length} audio devices`);
      
      audioDevices.forEach((device, index) => {
        addLog(`Device ${index + 1}: ${device.label || `Unknown ${device.deviceId.slice(0, 8)}`}`);
      });
      
      if (audioDevices.length > 0) {
        setSelectedDevice(audioDevices[0].deviceId);
      }
    } catch (error) {
      addLog(`Device enumeration failed: ${error.message}`, 'error');
    }
  };

  const requestPermission = async () => {
    try {
      addLog('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('Microphone permission granted');
      
      stream.getTracks().forEach(track => track.stop());
      await enumerateDevices();
      setPermissionStatus('granted');
    } catch (error) {
      addLog(`Permission request failed: ${error.message}`, 'error');
      setPermissionStatus('denied');
    }
  };

  const startTest = async () => {
    if (!selectedDevice) {
      addLog('No device selected', 'error');
      return;
    }

    try {
      setIsTesting(true);
      setLogs([]);
      addLog(`Starting audio test with device: ${selectedDevice}`);
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      addLog(`Audio context created, state: ${audioContextRef.current.state}`);
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        addLog(`Audio context resumed, state: ${audioContextRef.current.state}`);
      }
      
      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      addLog('Audio analyser created');
      
      // Get audio stream
      let stream;
      try {
        addLog('Getting audio stream...');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        addLog('Audio stream obtained');
      } catch (error) {
        addLog(`Failed to get audio stream: ${error.message}`, 'error');
        throw error;
      }
      
      streamRef.current = stream;
      addLog(`Stream tracks: ${stream.getTracks().length}`);
      stream.getTracks().forEach((track, index) => {
        addLog(`Track ${index}: ${track.kind}, enabled: ${track.enabled}, muted: ${track.muted}`);
      });
      
      // Create media stream source
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      addLog('Microphone connected to analyser');
      
      // Start monitoring
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      let frameCount = 0;
      
      const updateAudioLevel = () => {
        if (!isTesting) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        frameCount++;
        
        // Log every 50 frames or when there's activity
        if (frameCount % 50 === 0 || average > 5) {
          addLog(`Frame ${frameCount}: Audio level ${Math.round((average / 255) * 100)}% (raw: ${average})`);
        }
        
        requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      addLog('Audio monitoring started');
      
    } catch (error) {
      addLog(`Audio test failed: ${error.message}`, 'error');
      setIsTesting(false);
    }
  };

  const stopTest = () => {
    setIsTesting(false);
    setAudioLevel(0);
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
      addLog('Microphone disconnected');
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      addLog('Audio stream stopped');
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      addLog('Audio context closed');
    }
    
    addLog('Audio test stopped');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="audio-diagnostic">
      <div className="diagnostic-header">
        <h3>🔍 Audio Diagnostic Tool</h3>
        <div className="diagnostic-controls">
          <button onClick={clearLogs} className="clear-btn">
            🗑️ Clear Logs
          </button>
        </div>
      </div>

      <div className="diagnostic-grid">
        {/* Status Panel */}
        <div className="diagnostic-panel">
          <h4>📊 Status</h4>
          <div className="status-items">
            <div className="status-item">
              <label>Permission:</label>
              <span className={`permission-${permissionStatus}`}>{permissionStatus}</span>
            </div>
            <div className="status-item">
              <label>Devices Found:</label>
              <span>{devices.length}</span>
            </div>
            <div className="status-item">
              <label>Audio Level:</label>
              <span>{Math.round((audioLevel / 255) * 100)}%</span>
            </div>
          </div>
          
          <div className="action-buttons">
            <button onClick={requestPermission} className="action-btn">
              🔐 Request Permission
            </button>
            <button onClick={enumerateDevices} className="action-btn">
              🔄 Refresh Devices
            </button>
          </div>
        </div>

        {/* Audio Test Panel */}
        <div className="diagnostic-panel">
          <h4>🎵 Audio Test</h4>
          <div className="device-selector">
            <label>Select Device:</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="device-select"
            >
              <option value="">Choose device...</option>
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Device ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="test-controls">
            {!isTesting ? (
              <button onClick={startTest} className="test-btn start">
                🎵 Start Test
              </button>
            ) : (
              <button onClick={stopTest} className="test-btn stop">
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
              <div className="audio-info">
                <span>Level: {Math.round((audioLevel / 255) * 100)}%</span>
                <span>Raw: {audioLevel}</span>
              </div>
            </div>
          )}
        </div>

        {/* Logs Panel */}
        <div className="diagnostic-panel logs-panel">
          <h4>📋 Diagnostic Logs</h4>
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
      </div>
    </div>
  );
};

export default AudioDiagnostic; 