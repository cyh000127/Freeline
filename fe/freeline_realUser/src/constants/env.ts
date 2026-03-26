import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

export const API_BASE_URL =
  extra?.apiBaseUrl ?? 'https://j14a207.p.ssafy.io/api/v1';
