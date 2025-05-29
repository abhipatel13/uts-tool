import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('token');

// Create headers with auth token
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      // Redirect to login
      window.location.href = '/login';
      return Promise.reject(new Error('Authentication expired. Please login again.'));
    }
    return Promise.reject(error);
  }
);

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
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.post('/api/tactics', data, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create tactic');
      }
      throw error;
    }
  },

  getAll: async (): Promise<ApiResponse<Tactic[]>> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get('/api/tactics', {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch tactics');
      }
      throw error;
    }
  },

  getById: async (id: string): Promise<ApiResponse<Tactic>> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get(`/api/tactics/${id}`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch tactic');
      }
      throw error;
    }
  },

  update: async (id: string, data: Partial<CreateTacticRequest>): Promise<ApiResponse<Tactic>> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.put(`/api/tactics/${id}`, data, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update tactic');
      }
      throw error;
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.delete(`/api/tactics/${id}`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to delete tactic');
      }
      throw error;
    }
  }
}; 