import axios from 'axios';

// Create a custom axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Uncomment if using cookies for session/authentication
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Inject auth token from localStorage or cookies here
    // const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
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
    // if (error.response?.status === 401) {
    //   // Handle logout or redirect to login page
    //   if (typeof window !== 'undefined') {
    //     window.location.href = '/login';
    //   }
    // }
    return Promise.reject(error);
  }
);
