import axios from 'axios';

// Create a custom axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://j14a207.p.ssafy.io/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Uncomment if using cookies for session/authentication
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Inject auth token from localStorage or cookies here
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global API errors here (e.g., 401 Unauthorized)
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorStatus = error.response?.data?.error?.status || error.response?.data?.status;
      
      // Don't redirect if it's a mandatory password change - handled locally in login
      if (errorStatus === "PASSWORD_CHANGE_REQUIRED") {
        return Promise.reject(error);
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/booth/login';
      }
    }
    return Promise.reject(error);
  }
);
