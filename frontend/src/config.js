// Configuration file for API endpoints
const config = {
  // Backend URL - change this to switch between localhost and local IP
  // Options:
  // - 'http://127.0.0.1:8000' (for local development)
  // - 'http://192.168.29.164:8000' (for network access)
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000',
  
  // Frontend URL - for reference
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  
  // Socket.IO configuration
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://127.0.0.1:8000',
};

export default config; 