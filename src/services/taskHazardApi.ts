import { api } from '@/lib/api-client';
import { ApiResponse, TaskHazard, ApprovalsResponse } from '@/types';

export const TaskHazardApi = {
  // Create a new task hazard
  createTaskHazard: async (task: Omit<TaskHazard, 'id'>): Promise<TaskHazard> => {
    return api.post<TaskHazard>('/api/task-hazards', task);
  },

  // Get all task hazard assessments
  getTaskHazards: async (): Promise<ApiResponse<TaskHazard[]>> => {
    return api.get<ApiResponse<TaskHazard[]>>('/api/task-hazards');
  },

  // Get all task hazards for universal users (all companies)
  getTaskHazardsUniversal: async (): Promise<ApiResponse<TaskHazard[]>> => {
    return api.get<ApiResponse<TaskHazard[]>>('/api/task-hazards/universal');
  },

  // Get task hazards by company (for universal users)
  getByCompany: async (companyId: string): Promise<ApiResponse<TaskHazard[]>> => {
    return api.get<ApiResponse<TaskHazard[]>>(`/api/task-hazards/company/${companyId}`);
  },

  // Get a specific task hazard assessment
  getTaskHazard: async (id: string): Promise<ApiResponse<TaskHazard>> => {
    return api.get<ApiResponse<TaskHazard>>(`/api/task-hazards/${id}`);
  },

  // Update a task hazard assessment
  updateTaskHazard: async (id: string, taskData: Partial<TaskHazard>): Promise<ApiResponse<TaskHazard>> => {
    return api.put<ApiResponse<TaskHazard>>(`/api/task-hazards/${id}`, taskData);
  },

  // Approve or reject a task hazard assessment
  approveOrRejectTaskHazard: async (id: string, status: string, comments = ''): Promise<ApiResponse<TaskHazard>> => {
    return api.put<ApiResponse<TaskHazard>>(`/api/task-hazards/${id}/approval`, { id, status, comments });
  },

  // Delete a task hazard assessment
  deleteTaskHazard: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/task-hazards/${id}`);
  },

  // Get all approvals with optional filters
  getApprovals: async (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    includeInvalidated?: boolean;
  }): Promise<ApiResponse<ApprovalsResponse>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    
    if (params?.includeInvalidated) {
      searchParams.append('includeInvalidated', 'true');
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/task-hazards/approvals${queryString ? `?${queryString}` : ''}`;
    
    return api.get<ApiResponse<ApprovalsResponse>>(endpoint);
  },
}; 