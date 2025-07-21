// Centralized API-related types and interfaces

// Generic API response wrapper used across all services
export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

// Common API error structure
export interface ApiError {
  code?: string;
  message: string;
  status?: number;
}

// Pagination interface for list responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Common filter interface
export interface BaseFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Status types used across different entities
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'expired';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';