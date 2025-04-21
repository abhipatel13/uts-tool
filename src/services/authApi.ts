import { API_BASE_URL } from '@/config/api';
import axios from 'axios';

interface LoginResponse {
  status: boolean;
  data: {
    user: {
      _id: string;
      email: string;
      role: string;
      company: string;
    };
    token: string;
  };
  message: string;
}

interface LoginRequest {
  email: string;
  password: string;
  company: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Login failed');
      }
      throw error;
    }
  },

  logout: async (token: string): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Logout failed');
      }
      throw error;
    }
  }
}; 