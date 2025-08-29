import { api } from '@/lib/api-client';
import { User, ApiResponse, CreateUserRequest, UpdateProfileRequest, UpdatePasswordRequest } from '@/types';

export const UserApi = {
  // Get all users and supervisors
  getAll: async (): Promise<ApiResponse<User[]>> => {
    return api.get<ApiResponse<User[]>>('/api/users/getAllUser');
  },

  // Gets all users for the current user's company
  // Restricts user data in the response to only include id, email, role, and name
  getAllRestricted: async (): Promise<ApiResponse<User[]>> => {
    return api.get<ApiResponse<User[]>>('/api/users/getAllUserRestricted');
  },

  // Create new user
  create: async (data: CreateUserRequest): Promise<ApiResponse<User>> => {
    return api.post<ApiResponse<User>>('/api/users/createUser', data);
  },

  // Update user (superuser only)
  update: async (userId: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    return api.put<ApiResponse<User>>(`/api/users/editUser/${userId}`, data);
  },

  // Reset user password (superuser only)
  resetPassword: async (userId: string, newPassword: string): Promise<ApiResponse<void>> => {
    return api.put<ApiResponse<void>>(`/api/users/resetPassword/${userId}`, { newPassword });
  },

  // Delete user
  delete: async (userId: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/users/deleteUser/${userId}`);
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    return api.get<ApiResponse<User>>('/api/auth/profile');
  },

  // Update profile
  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
    return api.put<ApiResponse<User>>('/api/auth/profile', data);
  },

  // Update password
  updatePassword: async (data: UpdatePasswordRequest): Promise<ApiResponse<void>> => {
    return api.put<ApiResponse<void>>('/api/auth/password', data);
  }
}; 