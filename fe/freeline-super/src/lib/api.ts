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
    // 409 Conflict: 중복된 데이터 발생 시 한글 메시지 처리
    if (error.response?.status === 409) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error?.message;
      if (!serverMessage) {
        error.message = "중복된 데이터입니다.";
      }
    }

    // Handle global API errors here (e.g., 401 Unauthorized, 403 Forbidden)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle logout or redirect to login page
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/super/login';
      }
    }
    return Promise.reject(error);
  }
);
