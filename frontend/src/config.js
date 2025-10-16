// Configuration file for API endpoints

// Prefer explicit env vars if provided, otherwise auto-detect based on where the app is hosted.
const DEFAULT_LOCAL_BACKEND = 'http://127.0.0.1:8000';
const DEFAULT_PROD_BACKEND = 'https://voiceiq-backend.onrender.com';

// Determine if the current page is being served from a local environment.
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)$/.test(hostname);

// Resolve backend and socket URLs with the following precedence:
// 1) Explicit REACT_APP_* env vars
// 2) If running locally, use local backend
// 3) Otherwise, use production backend
const resolvedBackendUrl =
  process.env.REACT_APP_BACKEND_URL || (isLocalHost ? DEFAULT_LOCAL_BACKEND : DEFAULT_PROD_BACKEND);

const resolvedSocketUrl =
  process.env.REACT_APP_SOCKET_URL || (isLocalHost ? DEFAULT_LOCAL_BACKEND : DEFAULT_PROD_BACKEND);

const config = {
  // Backend URL used by fetch calls
  BACKEND_URL: resolvedBackendUrl,

  // Frontend URL - for reference
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',

  // Socket.IO configuration
  SOCKET_URL: resolvedSocketUrl,
};

export default config;