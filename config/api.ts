// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.7:8000/api',
};

// Update base URL
export const updateBaseUrl = (newUrl: string) => {
  API_CONFIG.BASE_URL = newUrl.endsWith('/') ? newUrl.slice(0, -1) : newUrl;
};

// Get current base URL
export const getBaseUrl = () => API_CONFIG.BASE_URL;
