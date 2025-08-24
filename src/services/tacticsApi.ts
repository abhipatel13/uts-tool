import { api } from '@/lib/api-client';
import { ApiResponse, Tactic, CreateTacticRequest } from '@/types';

export const TacticsApi = {
  create: async (data: CreateTacticRequest): Promise<ApiResponse<Tactic>> => {
    return api.post<ApiResponse<Tactic>>('/api/tactics', data);
  },

  getAll: async (): Promise<ApiResponse<Tactic[]>> => {
    return api.get<ApiResponse<Tactic[]>>('/api/tactics');
  },

  // Get all tactics for universal users (all companies)
  getAllUniversal: async (): Promise<ApiResponse<Tactic[]>> => {
    return api.get<ApiResponse<Tactic[]>>('/api/tactics/universal');
  },

  getById: async (id: string): Promise<ApiResponse<Tactic>> => {
    return api.get<ApiResponse<Tactic>>(`/api/tactics/${id}`);
  },

  update: async (id: string, data: Partial<CreateTacticRequest>): Promise<ApiResponse<Tactic>> => {
    return api.put<ApiResponse<Tactic>>(`/api/tactics/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/tactics/${id}`);
  }
}; 