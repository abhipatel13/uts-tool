import { API_BASE_URL } from '@/config/api';
import axios from 'axios';

export interface User {
  id: number;
  email: string;
  role: string;
  company: string;
}

interface ApiResponse<T> {
  status: boolean;
  data: T;
  message?: string;
}

interface CreateUserRequest {
  email: string;
  password: string;
  role: string;
}

interface UpdateProfileRequest {
  email: string;
  currentPassword: string;
  newPassword?: string;
}

const getAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

export const userApi = {
  // Get all users and supervisors
  getAll: async (): Promise<ApiResponse<User[]>> => {
    console.log('Fetching users...');
    const token = getAuthToken();
    console.log('Using token:', token);

    const response = await fetch(`${API_BASE_URL}/api/users/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch users');
    }

    return data;
  },

  // Create new user
  create: async (data: CreateUserRequest): Promise<ApiResponse<User>> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return response.json();
  },

  // Delete user
  delete: async (userId: string): Promise<ApiResponse<void>> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    return response.json();
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No authentication token');

      const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update profile');
      }
      throw error;
    }
  }
}; 