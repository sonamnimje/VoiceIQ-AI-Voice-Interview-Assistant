import React, { useState, useEffect, useRef } from 'react';
import './DeviceSelection.css';

const DeviceSelection = ({ onDevicesSelected, isCompact = false }) => {
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [isAudioTesting, setIsAudioTesting] = useState(false);
  const [isVideoTesting, setIsVideoTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoStream, setVideoStream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState({ audio: 'prompt', video: 'prompt' });
  const [videoError, setVideoError] = useState(null);

  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);

  useEffect(() => {
    // Only load devices if we're not already in an interview context
    if (!isCompact) {
      checkPermissionsAndLoadDevices();
    } else {
      // In compact mode (interview page), just enumerate devices without requesting permissions
      enumerateDevicesOnly();
    }
    
    return () => {
      // Cleanup
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      
      // Clean up audio resources
      if (microphoneRef.current) {
        try {
          microphoneRef.current.disconnect();
        } catch (error) {
          console.warn('Error disconnecting microphone during cleanup:', error);
        }
        microphoneRef.current = null;
      }
      
      if (analyserRef.current) {
        analyserRef.current = null;
      }
      
      // Only close audio context if it's not being used elsewhere
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
          console.log('Audio context closed during component cleanup');
        } catch (error) {
          console.warn('Error closing audio context during cleanup:', error);
        }
        audioContextRef.current = null;
      }
    };
  }, [isCompact]);

  const enumerateDevicesOnly = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Enumerating devices only (compact mode)...');

      // Get device lists without requesting permissions
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Available devices:', devices);
      
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const videoInputs = devices.filter(device => device.kind === 'videoinput');

      console.log('Audio devices:', audioInputs);
      console.log('Video devices:', videoInputs);

      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);

      // Set default selections
      if (audioInputs.length > 0) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
        console.log('Default audio device set:', audioInputs[0].label);
      }
      if (videoInputs.length > 0) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
        console.log('Default video device set:', videoInputs[0].label);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error enumerating devices:', err);
      setError(`Failed to enumerate devices: ${err.message}`);
      setIsLoading(false);
    }
  };

  const checkPermissionsAndLoadDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting device detection...');

      // Check if we have permissions (with fallback for browsers that don't support it)
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' });
        setPermissionStatus(prev => ({ ...prev, video: permissions.state }));
      } catch (permErr) {
        console.warn('Permissions API not supported:', permErr);
        setPermissionStatus(prev => ({ ...prev, video: 'prompt' }));
      }

      // Request permissions with better error handling
      let audioStream = null;
      let videoStream = null;

      try {
        console.log('Requesting audio permission...');
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissionStatus(prev => ({ ...prev, audio: 'granted' }));
        console.log('Audio permission granted');
      } catch (audioErr) {
        console.warn('Audio permission denied:', audioErr);
        setPermissionStatus(prev => ({ ...prev, audio: 'denied' }));
      }

      try {
        console.log('Requesting video permission...');
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setPermissionStatus(prev => ({ ...prev, video: 'granted' }));
        console.log('Video permission granted');
      } catch (videoErr) {
        console.warn('Video permission denied:', videoErr);
        setPermissionStatus(prev => ({ ...prev, video: 'denied' }));
      }

      // Stop the initial streams
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }

      // Get device lists
      console.log('Enumerating devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Available devices:', devices);
      
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const videoInputs = devices.filter(device => device.kind === 'videoinput');

      console.log('Audio devices:', audioInputs);
      console.log('Video devices:', videoInputs);

      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);

      // Set default selections
      if (audioInputs.length > 0) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
        console.log('Default audio device set:', audioInputs[0].label);
      }
      if (videoInputs.length > 0) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
        console.log('Default video device set:', videoInputs[0].label);
      }

      // If no devices found, show a helpful message
      if (audioInputs.length === 0 && videoInputs.length === 0) {
        setError('No audio or video devices found. Please check your device connections and permissions.');
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error in checkPermissionsAndLoadDevices:', err);
      setError(`Failed to access devices: ${err.message}`);
      setIsLoading(false);
    }
  };

  const testAudio = async () => {
    if (!selectedAudioDevice) {
      setError('Please select an audio device first');
      return;
    }

    try {
      setIsAudioTesting(true);
      setError(null);
      console.log('Starting audio test with device:', selectedAudioDevice);
      
      // Check if audio context exists and is not closed
      if (audioContextRef.current && audioContextRef.current.state === 'closed') {
        console.log('Audio context was closed, creating new one...');
        audioContextRef.current = null;
      }
      
      // Create audio context for level monitoring
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created, state:', audioContextRef.current.state);
      }
      
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        console.log('Audio context suspended, attempting to resume...');
        await audioContextRef.current.resume();
        console.log('Audio context resumed, state:', audioContextRef.current.state);
      }
      
      // Check if audio context is running
      if (audioContextRef.current.state !== 'running') {
        throw new Error(`Audio context not running. State: ${audioContextRef.current.state}`);
      }
      
      // Clean up any existing analyser
      if (analyserRef.current) {
        analyserRef.current = null;
      }
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      console.log('Audio analyser created');

      // Try with exact device first, fallback to preferred device, then default
      let stream;
      let streamMethod = '';
      try {
        console.log('Trying exact device match...');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { 
            deviceId: { exact: selectedAudioDevice },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
        streamMethod = 'exact';
        console.log('Stream obtained with exact device match');
      } catch (exactErr) {
        console.warn('Exact device failed, trying preferred:', exactErr);
        try {
          console.log('Trying preferred device...');
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { 
              deviceId: selectedAudioDevice,
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            }
          });
          streamMethod = 'preferred';
          console.log('Stream obtained with preferred device');
        } catch (preferredErr) {
          console.warn('Preferred device failed, trying default:', preferredErr);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            }
          });
          streamMethod = 'default';
          console.log('Stream obtained with default device');
        }
      }

      console.log(`Stream method used: ${streamMethod}`);
      console.log('Stream tracks:', stream.getTracks().length);
      stream.getTracks().forEach((track, index) => {
        console.log(`Track ${index}:`, track.kind, 'enabled:', track.enabled, 'muted:', track.muted);
      });

      // Check if we have audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in stream');
      }

      // Clean up any existing microphone source
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
        microphoneRef.current = null;
      }

      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      console.log('Microphone connected to analyser');

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      let frameCount = 0;
      let consecutiveZeroFrames = 0;
      
      const updateAudioLevel = () => {
        if (!isAudioTesting) return;
        
        try {
          // Check if audio context is still valid
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            console.warn('Audio context closed during testing, stopping...');
            setIsAudioTesting(false);
            return;
          }
          
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          
          frameCount++;
          
          // Log audio levels every 100 frames or when there's significant activity
          if (frameCount % 100 === 0 || average > 10) {
            console.log(`Frame ${frameCount}: Audio level ${Math.round((average / 255) * 100)}% (raw: ${average})`);
          }
          
          // Track consecutive zero frames for debugging
          if (average < 5) {
            consecutiveZeroFrames++;
            if (consecutiveZeroFrames % 50 === 0) {
              console.warn(`No audio detected for ${consecutiveZeroFrames} consecutive frames`);
            }
          } else {
            consecutiveZeroFrames = 0;
          }
          
          requestAnimationFrame(updateAudioLevel);
        } catch (error) {
          console.error('Error in updateAudioLevel:', error);
          setIsAudioTesting(false);
        }
      };
      
      updateAudioLevel();
      console.log('Audio monitoring started');
    } catch (err) {
      console.error('Error testing audio:', err);
      setError(`Audio test failed: ${err.message}`);
      setIsAudioTesting(false);
    }
  };

  const stopAudioTest = () => {
    setIsAudioTesting(false);
    setAudioLevel(0);
    
    // Clean up microphone source
    if (microphoneRef.current) {
      try {
        microphoneRef.current.disconnect();
      } catch (error) {
        console.warn('Error disconnecting microphone:', error);
      }
      microphoneRef.current = null;
    }
    
    // Clean up analyser
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    
    // Don't close the audio context immediately - keep it for potential reuse
    // Only close it when the component unmounts or when explicitly needed
    console.log('Audio test stopped, audio context preserved for reuse');
  };

  const troubleshootAudio = async () => {
    const issues = [];
    const suggestions = [];
    
    try {
      // Check if browser supports Web Audio API
      if (!window.AudioContext && !window.webkitAudioContext) {
        issues.push('Your browser does not support Web Audio API');
        suggestions.push('Try using Chrome, Firefox, or Safari');
      }
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        issues.push('Your browser does not support getUserMedia API');
        suggestions.push('Update your browser to the latest version');
      }
      
      // Check permissions
      if (navigator.permissions) {
        try {
          const audioPermission = await navigator.permissions.query({ name: 'microphone' });
          if (audioPermission.state === 'denied') {
            issues.push('Microphone permission is denied');
            suggestions.push('Click the microphone icon in your browser address bar and allow access');
          } else if (audioPermission.state === 'prompt') {
            suggestions.push('Click "Test Audio" to grant microphone permission');
          }
        } catch (permErr) {
          console.warn('Could not check permissions:', permErr);
        }
      }
      
      // Check if audio devices are available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      if (audioDevices.length === 0) {
        issues.push('No audio input devices found');
        suggestions.push('Check if your microphone is properly connected and not disabled in system settings');
      }
      
      // Check if selected device exists
      if (selectedAudioDevice) {
        const deviceExists = audioDevices.some(device => device.deviceId === selectedAudioDevice);
        if (!deviceExists) {
          issues.push('Selected audio device is no longer available');
          suggestions.push('Try refreshing devices or selecting a different microphone');
        }
      }
      
      // Check if audio context is working
      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          issues.push('Audio context is suspended');
          suggestions.push('Try clicking "Test Audio" again to resume audio processing');
        } else if (audioContextRef.current.state === 'closed') {
          issues.push('Audio context is closed');
          suggestions.push('Click "Test Audio" to create a new audio context');
        }
      }
      
      // Provide general suggestions if no specific issues found
      if (issues.length === 0) {
        suggestions.push('Make sure your microphone is not muted in system settings');
        suggestions.push('Try speaking louder or moving closer to the microphone');
        suggestions.push('Check if other applications are using the microphone');
        suggestions.push('Try selecting a different audio device');
      }
      
      const message = issues.length > 0 
        ? `Issues detected:\n${issues.join('\n')}\n\nSuggestions:\n${suggestions.join('\n')}`
        : `No obvious issues detected.\n\nSuggestions:\n${suggestions.join('\n')}`;
      
      setError(message);
    } catch (error) {
      setError(`Error during troubleshooting: ${error.message}`);
    }
  };

  const recoverAudioContext = () => {
    try {
      // Clean up existing audio context if it's closed
      if (audioContextRef.current && audioContextRef.current.state === 'closed') {
        console.log('Recovering from closed audio context...');
        audioContextRef.current = null;
        analyserRef.current = null;
        microphoneRef.current = null;
        setAudioLevel(0);
        setIsAudioTesting(false);
        setError('Audio context recovered. Try testing audio again.');
      }
    } catch (error) {
      console.error('Error recovering audio context:', error);
      setError(`Error recovering audio context: ${error.message}`);
    }
  };

  const testVideo = async () => {
    if (!selectedVideoDevice) {
      setError('Please select a video device first');
      return;
    }

    try {
      setIsVideoTesting(true);
      setError(null);
      
      // Stop previous stream
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }

      // Try with exact device first, fallback to preferred device, then default
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedVideoDevice } }
        });
      } catch (exactErr) {
        console.warn('Exact video device failed, trying preferred:', exactErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: selectedVideoDevice }
          });
        } catch (preferredErr) {
          console.warn('Preferred video device failed, trying default:', preferredErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      setVideoStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays
        videoRef.current.play().catch(playErr => {
          console.warn('Video play failed:', playErr);
          setVideoError('Video playback failed. Please check your camera permissions.');
        });
      }
    } catch (err) {
      console.error('Error testing video:', err);
      setError(`Video test failed: ${err.message}`);
      setIsVideoTesting(false);
    }
  };

  const stopVideoTest = () => {
    setIsVideoTesting(false);
    setVideoError(null);
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleConfirmDevices = () => {
    if (!selectedAudioDevice && !selectedVideoDevice) {
      setError('Please select at least one device');
      return;
    }

    if (onDevicesSelected) {
      onDevicesSelected({
        audioDevice: selectedAudioDevice,
        videoDevice: selectedVideoDevice
      });
    } else {
      // In interview page context, just show success message
      setError('Devices configured successfully!');
      setTimeout(() => setError(null), 2000);
    }
  };

  const refreshDevices = () => {
    if (isCompact) {
      enumerateDevicesOnly();
    } else {
      checkPermissionsAndLoadDevices();
    }
  };

  const testDefaultDevices = async () => {
    try {
      setError(null);
      
      // Test with default devices (no specific device selection)
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      console.log('Default devices test successful');
      console.log('Audio tracks:', audioStream.getAudioTracks());
      console.log('Video tracks:', videoStream.getVideoTracks());
      
      // Stop the test streams
      audioStream.getTracks().forEach(track => track.stop());
      videoStream.getTracks().forEach(track => track.stop());
      
      setError('Default devices test successful! You can now try specific devices.');
    } catch (err) {
      console.error('Default devices test failed:', err);
      setError(`Default devices test failed: ${err.message}`);
    }
  };

  const quickTest = async () => {
    try {
      setError(null);
      console.log('Quick test - checking device access...');
      
      // Check if required APIs are available
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API not supported');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }
      
      console.log('MediaDevices API available');
      
      // Quick permission check
      const hasAudio = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Audio permission granted, tracks:', hasAudio.getTracks().length);
      
      const hasVideo = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Video permission granted, tracks:', hasVideo.getTracks().length);
      
      hasAudio.getTracks().forEach(track => track.stop());
      hasVideo.getTracks().forEach(track => track.stop());
      
      setError('Quick test passed! Device access is working.');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Quick test failed:', err);
      setError(`Quick test failed: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="device-selection">
        <div className="device-loading">
          <div className="loading-spinner"></div>
          <p>Loading available devices...</p>
        </div>
      </div>
    );
  }

  if (error && !audioDevices.length && !videoDevices.length) {
    return (
      <div className="device-selection">
        <div className="device-error">
          <div className="error-icon">⚠️</div>
          <h3>Device Access Error</h3>
          <p>{error}</p>
          <div className="permission-status">
            <p>Audio Permission: <span className={`status-${permissionStatus.audio}`}>{permissionStatus.audio}</span></p>
            <p>Video Permission: <span className={`status-${permissionStatus.video}`}>{permissionStatus.video}</span></p>
          </div>
          <button onClick={refreshDevices} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`device-selection ${isCompact ? 'compact' : ''}`}>
      <div className="device-header">
        <h3>🎤 Device Selection</h3>
                    <div className="debug-info">
              <p>Audio: {audioDevices.length} | Video: {videoDevices.length}</p>
              <div className="debug-buttons">
                <button onClick={refreshDevices} className="debug-btn">
                  🔄
                </button>
                <button onClick={testDefaultDevices} className="debug-btn">
                  🧪
                </button>
                <button onClick={quickTest} className="debug-btn">
                  ⚡
                </button>
              </div>
            </div>
      </div>

      {error && (
        <div className={`message ${error.includes('successfully') ? 'success-message' : 'error-message'}`}>
          {error}
        </div>
      )}

      <div className="device-grid">
        {/* Audio Device Selection */}
        <div className="device-panel audio-panel">
          <div className="panel-header">
            <h3>🎤 Microphone</h3>
            <button 
              onClick={refreshDevices}
              className="refresh-btn"
              title="Refresh devices"
            >
              🔄
            </button>
          </div>

          <div className="device-selector">
            <label>Select Microphone:</label>
            <select
              value={selectedAudioDevice}
              onChange={(e) => setSelectedAudioDevice(e.target.value)}
              className="device-select"
            >
              <option value="">Choose a microphone...</option>
              {audioDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            {audioDevices.length === 0 && (
              <p className="no-devices">No audio devices found</p>
            )}
          </div>

          <div className="device-test">
            <div className="test-controls">
              {!isAudioTesting ? (
                <button 
                  onClick={testAudio}
                  className="test-btn start"
                  disabled={!selectedAudioDevice}
                >
                  🎵 Test Audio
                </button>
              ) : (
                <button 
                  onClick={stopAudioTest}
                  className="test-btn stop"
                >
                  ⏹️ Stop Test
                </button>
              )}
              <button 
                onClick={troubleshootAudio}
                className="test-btn troubleshoot"
                title="Troubleshoot audio issues"
              >
                🔧 Troubleshoot
              </button>
              {audioContextRef.current && audioContextRef.current.state === 'closed' && (
                <button 
                  onClick={recoverAudioContext}
                  className="test-btn recover"
                  title="Recover audio context"
                >
                  🔄 Recover
                </button>
              )}
            </div>

            {isAudioTesting && (
              <div className="audio-visualizer">
                <div className="audio-bar">
                  <div 
                    className={`audio-level ${audioLevel < 5 ? 'no-audio' : ''}`}
                    style={{ width: `${(audioLevel / 255) * 100}%` }}
                  ></div>
                </div>
                <span className={`audio-label ${audioLevel < 5 ? 'no-audio-text' : ''}`}>
                  Audio Level: {Math.round((audioLevel / 255) * 100)}%
                  {audioLevel < 5 && <span className="no-audio-warning"> (No audio detected)</span>}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Video Device Selection */}
        <div className="device-panel video-panel">
          <div className="panel-header">
            <h3>📹 Camera</h3>
            <button 
              onClick={refreshDevices}
              className="refresh-btn"
              title="Refresh devices"
            >
              🔄
            </button>
          </div>

          <div className="device-selector">
            <label>Select Camera:</label>
            <select
              value={selectedVideoDevice}
              onChange={(e) => setSelectedVideoDevice(e.target.value)}
              className="device-select"
            >
              <option value="">Choose a camera...</option>
              {videoDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            {videoDevices.length === 0 && (
              <p className="no-devices">No video devices found</p>
            )}
          </div>

          <div className="device-test">
            <div className="test-controls">
              {!isVideoTesting ? (
                <button 
                  onClick={testVideo}
                  className="test-btn start"
                  disabled={!selectedVideoDevice}
                >
                  📹 Test Camera
                </button>
              ) : (
                <button 
                  onClick={stopVideoTest}
                  className="test-btn stop"
                >
                  ⏹️ Stop Test
                </button>
              )}
            </div>

            {isVideoTesting && (
              <div className="video-preview">
                {videoError ? (
                  <div className="video-error">
                    <div className="error-icon">⚠️</div>
                    <p>{videoError}</p>
                    <button onClick={stopVideoTest} className="retry-btn">
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="preview-video"
                      onLoadedMetadata={() => console.log('Video metadata loaded')}
                      onError={(e) => {
                        console.error('Video error:', e);
                        setVideoError('Failed to load video stream');
                      }}
                    />
                    <div className="video-overlay">
                      <span>Camera Preview</span>
                      <div className="video-status">
                        {videoStream ? 'Live' : 'Loading...'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="device-actions">
        <button 
          onClick={handleConfirmDevices}
          className="confirm-btn compact"
          disabled={!selectedAudioDevice && !selectedVideoDevice}
        >
          ✅ Confirm
        </button>
      </div>
    </div>
  );
};

export default DeviceSelection;