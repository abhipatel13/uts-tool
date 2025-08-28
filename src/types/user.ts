// Consolidated User interface for the entire application
export interface User {
  id: string | number;
  email: string;
  name?: string;
  role: string;
  company_id?: number;
  company?:{
    id?: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };
  phone?: string;
  department?: string;
  permissions?: string[];
  isAuthenticated?: boolean;
}

// Auth-related interfaces
export interface LoginRequest {
  email: string;
  password: string;
  company: string;
}

export interface LoginResponse {
  status: boolean;
  data: {
    user: {
      _id: string;
      email: string;
      role: string;
      name?: string | undefined;
      company: {
        id?: number | undefined;
        name: string;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        deletedAt?: string | null | undefined;
      };
    };
    token: string;
  };
  message: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: string;
}

export interface UpdateProfileRequest {
  email: string;
  currentPassword: string;
  newPassword?: string;
}
