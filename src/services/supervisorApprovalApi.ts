import { api } from '@/lib/api-client';
import { ApiResponse } from '@/types';

export const SupervisorApprovalApi = {
  // Get all approvals (polymorphic)
  getApprovals: async (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    includeInvalidated?: boolean;
    approvableType?: 'task_hazards' | 'risk_assessments';
  }): Promise<ApiResponse<any>> => {
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
    
    return api.get<ApiResponse<any>>(endpoint);
  },

  // Approve or reject an entity
  approveOrReject: async (id: string, status: string, comments = '', approvableType: 'task_hazards' | 'risk_assessments'): Promise<ApiResponse<any>> => {
    return api.put<ApiResponse<any>>(`/api/supervisor-approvals/${id}`, { 
      status, 
      comments,
      approvableType
    });
  },

  // Get approval history for an entity
  getApprovalHistory: async (id: string, approvableType: 'task_hazards' | 'risk_assessments'): Promise<ApiResponse<any>> => {
    return api.get<ApiResponse<any>>(`/api/supervisor-approvals/${id}/history?approvableType=${approvableType}`);
  }
};
