// Consolidated User interface for the entire application
export interface User {
  id: string | number;
  email: string;
  name?: string;
  role: string;
  company?:
    | string
    | {
        id: number;
        name: string;
      };
  site?: {
    id: number;
    name: string;
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
      name: string | null;
      company: {
        id: number;
        name: string;
      };
      site: {
        id: number;
        name: string;
      } | null;
    };
    token: string;
  };
  message: string;
}

export interface ProfileResponse {
  status: boolean;
  data: {
    user: User;
  };
  message: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: string;
  // Optional: set primary site during creation
  primarySiteId?: number;
}

export interface UpdateProfileRequest {
  email: string;
  currentPassword: string;
  newPassword?: string;
}
