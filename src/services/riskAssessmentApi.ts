import { api } from '@/lib/api-client';
import { ApiResponse, RiskAssessment } from '@/types';

export const RiskAssessmentApi = {
  // Create a new risk assessment
  createRiskAssessment: async (assessment: Omit<RiskAssessment, 'id'>): Promise<RiskAssessment> => {
    return api.post<RiskAssessment>('/api/risk-assessments', assessment);
  },

  // Get all risk assessments
  getRiskAssessments: async (): Promise<ApiResponse<RiskAssessment[]>> => {
    return api.get<ApiResponse<RiskAssessment[]>>('/api/risk-assessments');
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
}; 