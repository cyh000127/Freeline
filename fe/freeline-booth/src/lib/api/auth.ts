import { api } from '../api';

export interface LoginRequest {
  id?: string;
  password?: string;
}

export interface InitPasswordRequest {
  loginId: string;
  oldPassword: string;
  newPassword: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post('/v1/auth/login', data),
  getMe: () => api.get('/v1/auth/booth-admins/me'),
  updateInitialPassword: (data: InitPasswordRequest) => api.patch('/v1/auth/booth-admins/password/initial', data),
};
