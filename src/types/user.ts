// Consolidated User interface for the entire application
export interface User {
  id: string | number;
  email: string;
  name?: string;
  role: string;
  company?:
    | string
    | {
        id?: number;
        name: string;
        createdAt?: string;
        updatedAt?: string;
        deletedAt?: string | null;
      };
  company_id?: number;
  permissions?: string[];
  isAuthenticated?: boolean;
  user_type?: string; // For backward compatibility
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
      company: string;
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
