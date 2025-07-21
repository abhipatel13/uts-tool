import { api } from '@/lib/api-client';
import { LoginRequest, LoginResponse } from '@/types/user';

export const AuthApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/auth/login', data, { requireAuth: false });
  },

  logout: async (token: string): Promise<void> => {
    return api.post<void>('/api/auth/logout', null, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
}; 