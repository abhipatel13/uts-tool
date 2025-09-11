import { api } from '@/lib/api-client';
import { ApiResponse, RiskAssessment, ApprovalsResponse, PaginatedResponse, BaseFilters } from '@/types';
import { TaskHazardApi } from './taskHazardApi';

export const RiskAssessmentApi = {
  // Create a new risk assessment
  createRiskAssessment: async (assessment: Omit<RiskAssessment, 'id'>): Promise<RiskAssessment> => {
    return api.post<RiskAssessment>('/api/risk-assessments', assessment);
  },

  // Get all risk assessments
  getRiskAssessments: async (
    params?: Pick<BaseFilters, 'page' | 'limit' | 'search'>
  ): Promise<PaginatedResponse<RiskAssessment>> => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/api/risk-assessments${queryString ? `?${queryString}` : ''}`;

    return api.get<PaginatedResponse<RiskAssessment>>(endpoint);
  },

  // Get risk assessments with minimal data (optimized for tables)
  getRiskAssessmentsMinimal: async (
    params?: Pick<BaseFilters, 'page' | 'limit' | 'search'>
  ): Promise<PaginatedResponse<Partial<RiskAssessment>>> => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/api/risk-assessments/minimal${queryString ? `?${queryString}` : ''}`;

    return api.get<PaginatedResponse<Partial<RiskAssessment>>>(endpoint);
  },

  // Get all risk assessments for universal users (all companies)
  getRiskAssessmentsUniversal: async (): Promise<ApiResponse<RiskAssessment[]>> => {
    return api.get<ApiResponse<RiskAssessment[]>>('/api/risk-assessments/universal');
  },

  // Get a specific risk assessment
  getRiskAssessment: async (id: string): Promise<ApiResponse<RiskAssessment>> => {
    return api.get<ApiResponse<RiskAssessment>>(`/api/risk-assessments/${id}`);
  },

  // Update a risk assessment
  updateRiskAssessment: async (id: string, assessmentData: Partial<RiskAssessment>): Promise<ApiResponse<RiskAssessment>> => {
    return api.put<ApiResponse<RiskAssessment>>(`/api/risk-assessments/${id}`, assessmentData);
  },

  // Delete a risk assessment
  deleteRiskAssessment: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/risk-assessments/${id}`);
  },

  // Delete a risk assessment (Universal User - all companies)
  deleteRiskAssessmentUniversal: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/risk-assessments/universal/${id}`);
  },

  // Get approvals for risk assessments
  getApprovals: async (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    includeInvalidated?: boolean;
  }): Promise<ApiResponse<ApprovalsResponse>> => {
    return TaskHazardApi.getApprovals({
      ...params,
      approvableType: 'risk_assessments'
    });
  },

  // Approve or reject a risk assessment
  approveOrRejectRiskAssessment: async (id: string, status: string, comments = ''): Promise<ApiResponse<RiskAssessment>> => {
    return api.put<ApiResponse<RiskAssessment>>(`/api/supervisor-approvals/${id}`, { 
      status, 
      comments,
      approvableType: 'risk_assessments'
    });
  },
};
