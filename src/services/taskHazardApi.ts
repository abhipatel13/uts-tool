import { api } from '@/lib/api-client';
import { ApiResponse, TaskHazard, ApprovalsResponse, PaginatedResponse, BaseFilters } from '@/types';

export const TaskHazardApi = {
  // Create a new task hazard
  createTaskHazard: async (task: Omit<TaskHazard, 'id'>): Promise<TaskHazard> => {
    return api.post<TaskHazard>('/api/task-hazards', task);
  },

  // Get task hazard assessments with pagination and search
  getTaskHazards: async (
    params?: Pick<BaseFilters, 'page' | 'limit' | 'search'>
  ): Promise<PaginatedResponse<TaskHazard>> => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/api/task-hazards${queryString ? `?${queryString}` : ''}`;

    return api.get<PaginatedResponse<TaskHazard>>(endpoint);
  },

  // Get task hazards with minimal data (optimized for tables)
  getTaskHazardsMinimal: async (
    params?: Pick<BaseFilters, 'page' | 'limit' | 'search'>
  ): Promise<PaginatedResponse<Partial<TaskHazard>>> => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/api/task-hazards/minimal${queryString ? `?${queryString}` : ''}`;

    return api.get<PaginatedResponse<Partial<TaskHazard>>>(endpoint);
  },

  // Get all task hazards for universal users (all companies)
  getTaskHazardsUniversal: async (): Promise<ApiResponse<TaskHazard[]>> => {
    return api.get<ApiResponse<TaskHazard[]>>('/api/task-hazards/universal');
  },

  // Get task hazards by company (for universal users)
  getByCompany: async (companyId: string): Promise<PaginatedResponse<TaskHazard>> => {
    return api.get<PaginatedResponse<TaskHazard>>(`/api/task-hazards/company/${companyId}`);
  },

  // Get a specific task hazard assessment
  getTaskHazard: async (id: string): Promise<ApiResponse<TaskHazard>> => {
    return api.get<ApiResponse<TaskHazard>>(`/api/task-hazards/${id}`);
  },

  // Update a task hazard assessment
  updateTaskHazard: async (id: string, taskData: Partial<TaskHazard>): Promise<ApiResponse<TaskHazard>> => {
    return api.put<ApiResponse<TaskHazard>>(`/api/task-hazards/${id}`, taskData);
  },

  // Approve or reject a task hazard assessment - Updated to use polymorphic system
  // Note: This method is deprecated - use SupervisorApprovalApi.approveOrReject instead
  approveOrRejectTaskHazard: async (id: string, status: string, comments = ''): Promise<ApiResponse<TaskHazard>> => {
    return api.put<ApiResponse<TaskHazard>>(`/api/supervisor-approvals/${id}`, { 
      status, 
      comments,
      approvableType: 'task_hazards'
    });
  },

  // Delete a task hazard assessment
  deleteTaskHazard: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/task-hazards/${id}`);
  },

  // Delete a task hazard assessment (Universal User - all companies)
  deleteTaskHazardUniversal: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/task-hazards/universal/${id}`);
  },

  // Get all approvals with optional filters - Updated to support polymorphic system
  getApprovals: async (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    includeInvalidated?: boolean;
    approvableType?: 'task_hazards' | 'risk_assessments'; // New parameter for polymorphic support
  }): Promise<ApiResponse<ApprovalsResponse>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    
    if (params?.includeInvalidated) {
      searchParams.append('includeInvalidated', 'true');
    }
    
    if (params?.approvableType) {
      searchParams.append('approvableType', params.approvableType);
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/supervisor-approvals${queryString ? `?${queryString}` : ''}`;
    
    return api.get<ApiResponse<ApprovalsResponse>>(endpoint);
  },
}; 