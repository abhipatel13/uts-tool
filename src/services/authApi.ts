import { api } from '@/lib/api-client';
import { LoginRequest, LoginResponse, User } from '@/types/user';
import { ApiResponse } from '@/types/api';

export const AuthApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/auth/login', data, { requireAuth: false });
  },

  logout: async (token: string): Promise<void> => {
    return api.post<void>('/api/auth/logout', null, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  forgotPassword: async (data: {email: string}): Promise<ApiResponse<User>> => {
    return api.post<ApiResponse<User>>('/api/auth/forgot-password', data, { requireAuth: false });
  },

  // Reset password using token received via email
  resetPasswordByToken: async (data: { token: string; newPassword: string }): Promise<ApiResponse<void>> => {
    return api.post<ApiResponse<void>>('/api/auth/reset-password', data, { requireAuth: false });
  },
}; 