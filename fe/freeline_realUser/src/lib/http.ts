import axios from 'axios';
import { API_BASE_URL } from '@/constants/env';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
