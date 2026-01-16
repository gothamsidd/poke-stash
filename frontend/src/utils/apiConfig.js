// API Configuration
// In production, REACT_APP_API_URL must be set in Vercel environment variables

const getApiUrl = () => {
  // If REACT_APP_API_URL is set, use it (highest priority)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're in production (Vercel)
  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' &&
                       !window.location.hostname.includes('localhost');
  
  // In production without env var, try to use relative path
  // This works if backend is deployed on same domain or has proxy setup
  if (isProduction) {
    console.warn('REACT_APP_API_URL is not set! Using relative path. Please configure REACT_APP_API_URL in Vercel environment variables for production.');
    // Use relative path - Vercel proxy or same domain
    return '/api';
  }
  
  // Development fallback
  return 'http://localhost:5001/api';
};

export const API_URL = getApiUrl();

// Helper to check if API is configured
export const isApiConfigured = () => {
  return process.env.REACT_APP_API_URL || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};
