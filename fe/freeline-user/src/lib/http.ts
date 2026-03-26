import axios from 'axios';
import { API_BASE_URL } from '@/constants/env';
import { toUserErrorMessage } from '@/utils/error';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) =>
    Promise.reject(new Error(toUserErrorMessage(error, '요청 처리에 실패했습니다.'))),
);
