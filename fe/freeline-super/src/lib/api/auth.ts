import { api } from '../api';

// --- Types (Can be refined later when exact DTO is known) ---
export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface SignupRequest {
  email?: string;
  password?: string;
  name?: string;
  organization?: string;
}

export interface EmailAuthCodeVerifyRequest {
  email: string;
  code: string;
}

export interface UpdateProfileRequest {
  name?: string;
  organization?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

// --- API Functions ---

export const authApi = {
  // 공통
  login: (data: LoginRequest) => api.post('/v1/auth/login', data),
  logout: () => api.post('/v1/auth/logout'),
  refresh: (data?: any) => api.post('/v1/auth/refresh', data),

  // 행사 주최자 (Super Admin)
  checkEmail: (email: string) => 
    api.get('/v1/auth/email/check', { params: { email } }),
    
  sendEmailCode: (email: string) => 
    api.post('/v1/auth/email/send', null, { params: { email } }),
  
  verifyEmailCode: (data: EmailAuthCodeVerifyRequest) => 
    api.post('/v1/auth/email/verify', data),
    
  signup: (data: SignupRequest) => api.post('/v1/auth/signup', data),
  
  getMe: () => api.get('/v1/auth/me'),
  
  updateMe: (data: UpdateProfileRequest) => api.patch('/v1/auth/me', data),
  
  changePassword: (data: ChangePasswordRequest) => api.patch('/v1/auth/password', data),
  
  deleteAccount: () => api.delete('/v1/auth/me'),

  // 부스 관리자 관련 (행사 주최자가 호출)
  bulkCreateBoothAdmins: (data: any) => api.post('/v1/auth/booth-admins/bulk', data),
  bulkSendBoothAdminLogins: (data: any) => api.post('/v1/auth/booth-admins/send-login-info', data),
  getBoothAdmins: (eventId: number | string) => api.get(`/v1/auth/booth-admins/event/${eventId}`),
  updateBoothAdmin: (adminId: number | string, data: any) => api.patch(`/v1/booths/accounts/${adminId}`, data),
  deleteBoothAdmin: (adminId: number | string) => api.delete(`/v1/booths/accounts/${adminId}`),
};
