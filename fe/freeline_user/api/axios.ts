import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://10.0.0.2:8081/api/v1' /*android studio 기반 베이스 주소*/,
  timeout: 5000,
  headers: {
    'content-type': 'application/json',
  },
});
