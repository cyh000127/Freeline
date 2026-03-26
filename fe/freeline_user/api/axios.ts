import axios from 'axios';
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ?? 'https://j14a207.p.ssafy.io/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'content-type': 'application/json',
  },
});
