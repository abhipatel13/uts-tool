import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
});

export interface AssetDetails {
  asset_id: string;
  manufacturer: string;
  model: string;
  asset_group: string;
  description: string;
  criticality: string;
  failure_mode: string;
  failure_cause: string;
  failure_effect: string;
  failure_evident: string;
  affects_safety: string;
  suitable_task: string;
  maintenance_strategy: string;
  controls: string;
  actions: string;
  responsibility: string;
  activity_name: string;
  activity_desc: string;
  activity_type: string;
  activity_cause: string;
  activity_source: string;
  tactic: string;
  shutdown: string;
  department: string;
  frequency: string;
  doc_number: string;
  doc_desc: string;
  picture: string;
  resource: string;
  hours: string;
  units: string;
  overhaul: string;
  shutdowns: string;
}

export interface Tactic {
  id: string;
  analysis_name: string;
  location: string;
  status: string;
  asset_details: AssetDetails;
  company: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export type CreateTacticRequest = Omit<Tactic, 'id' | 'created_at' | 'updated_at'>;

interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
}

export const tacticsApi = {
  create: async (data: CreateTacticRequest): Promise<ApiResponse<Tactic>> => {
    const response = await api.post('/api/tactics', data);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<Tactic[]>> => {
    const response = await api.get('/api/tactics');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Tactic>> => {
    const response = await api.get(`/api/tactics/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTacticRequest>): Promise<ApiResponse<Tactic>> => {
    const response = await api.put(`/api/tactics/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/api/tactics/${id}`);
    return response.data;
  }
}; 