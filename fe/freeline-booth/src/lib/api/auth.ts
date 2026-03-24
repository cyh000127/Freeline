import { api } from '../api';

export interface LoginRequest {
  id?: string;
  password?: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post('/v1/auth/login', data),
};
