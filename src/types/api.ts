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
  error?: string;
}

// Pagination interfaces aligned with backend response
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// Common filter interface
export interface BaseFilters {
  search?: string; // free-text search
  page?: number;   // 1-based page index
  limit?: number;  // page size (max 100)
}

// Status types used across different entities
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'expired';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';