import { api } from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { User } from '@/types/user';

// export interface UniversalUser {
//   id: string | number;
//   email: string;
//   name?: string;
//   role: string;
//   company?: {
//     id: number;
//     name: string;
//   };
//   company_id?: number;
//   department?: string;
//   business_unit?: string;
//   plant?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

export interface CreateUniversalUserRequest {
  email: string;
  password: string;
  role: string;
  company_id?: number;
  name?: string;
  department?: string;
  business_unit?: string;
  plant?: string;
}

export interface UpdateUniversalUserRequest {
  email?: string;
  role?: string;
  company_id?: number;
  name?: string;
  department?: string;
  business_unit?: string;
  plant?: string;
}

export interface Company {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
}

export interface UniversalUserListResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
  };
}

export const UniversalUserApi = {
  // Get all users across all companies
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    company_id?: number;
    search?: string;
  }): Promise<ApiResponse<UniversalUserListResponse>> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.company_id) queryParams.append('company_id', params.company_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const url = `/api/universal/users${queryString ? `?${queryString}` : ''}`;
    
    return api.get<ApiResponse<UniversalUserListResponse>>(url);
  },

  // Create a new user (any role, any company)
  createUser: async (userData: CreateUniversalUserRequest): Promise<ApiResponse<User>> => {
    return api.post<ApiResponse<User>>('/api/universal/users', userData);
  },

  // Update a user
  updateUser: async (userId: string | number, userData: UpdateUniversalUserRequest): Promise<ApiResponse<User>> => {
    return api.put<ApiResponse<User>>(`/api/universal/users/${userId}`, userData);
  },

  // Delete a user
  deleteUser: async (userId: string | number): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/universal/users/${userId}`);
  },

  // Reset user password
  resetUserPassword: async (userId: string | number, newPassword: string): Promise<ApiResponse<void>> => {
    return api.put<ApiResponse<void>>(`/api/universal/users/${userId}/reset-password`, { newPassword });
  },

  // Change own password
  changeOwnPassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    return api.put<ApiResponse<void>>('/api/universal/change-password', { currentPassword, newPassword });
  },

  // Get all companies
  getAllCompanies: async (): Promise<ApiResponse<Company[]>> => {
    return api.get<ApiResponse<Company[]>>('/api/universal/companies');
  },

  // Create a new company
  createCompany: async (companyData: CreateCompanyRequest): Promise<ApiResponse<Company>> => {
    return api.post<ApiResponse<Company>>('/api/universal/companies', companyData);
  },

  // Update a company
  updateCompany: async (companyId: string | number, companyData: Partial<CreateCompanyRequest>): Promise<ApiResponse<Company>> => {
    return api.put<ApiResponse<Company>>(`/api/universal/companies/${companyId}`, companyData);
  },

  // Delete a company
  deleteCompany: async (companyId: string | number): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/universal/companies/${companyId}`);
  },

  // Get user statistics
  getUserStats: async (): Promise<ApiResponse<{
    totalUsers: number;
    universalUsers: number;
    superusers: number;
    admins: number;
    supervisors: number;
    users: number;
    totalCompanies: number;
  }>> => {
    const usersResponse = await UniversalUserApi.getAllUsers({ limit: 1000 });
    const companiesResponse = await UniversalUserApi.getAllCompanies();
    
    if (!usersResponse.status || !companiesResponse.status) {
      throw new Error('Failed to fetch statistics');
    }

    const users = usersResponse.data.users;
    const companies = companiesResponse.data;

    return {
      status: true,
      data: {
        totalUsers: users.length,
        universalUsers: users.filter((u: User) => u.role === 'universal_user').length,
        superusers: users.filter((u: User) => u.role === 'superuser').length,
        admins: users.filter((u: User) => u.role === 'admin').length,
        supervisors: users.filter((u: User) => u.role === 'supervisor').length,
        users: users.filter((u: User) => u.role === 'user').length,
        totalCompanies: companies.length,
      }
    };
  },
}; 