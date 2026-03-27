/**
 * Global Axios Configuration
 * 
 * NOTE: This file is deprecated in favor of the centralized API service
 * located at src/services/api/base.ts
 * 
 * The base.ts service provides:
 * - Centralized HTTP client configuration
 * - Automatic token injection
 * - Comprehensive error handling
 * - Request/response logging
 * - Retry logic
 * 
 * This file is kept for backward compatibility but should not be used
 * for new code. Use the api service from src/services/api instead.
 */

import axios from 'axios';

// Global axios defaults
axios.defaults.timeout = 10000; // 10 seconds
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Global request interceptor
axios.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching issues
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor for logging (optional)
axios.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default axios;
