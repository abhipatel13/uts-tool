// API service for handling all API requests

// Get the API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Define interfaces for API data types
export interface Risk {
  id?: string;
  riskDescription: string;
  riskType: string;
  asIsLikelihood: string;
  asIsConsequence: string;
  mitigatingAction: string;
  mitigatedLikelihood: string;
  mitigatedConsequence: string;
  mitigatingActionType: string;
  requiresSupervisorSignature: boolean;
}

export interface TaskHazard {
  id: string;
  date: string;
  time: string;
  scopeOfWork: string;
  assetSystem: string;
  systemLockoutRequired: boolean;
  trainedWorkforce: string;
  risks: Risk[];
  individual: string;
  supervisor: string;
  status: string;
  location: string;
}

export interface GeoFenceSettings {
  limit: number;
}

// API response structure
export interface ApiResponse<T> {
  data: T;
  status: boolean;
}

/**
 * Generic function to make API requests
 */
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API request failed with status ${response.status}`);
  }

  return data;
}

/**
 * Task Hazard API functions
 */
export const taskHazardApi = {
  // Create a new task hazard assessment
  createTaskHazard: async (taskData: TaskHazard): Promise<ApiResponse<TaskHazard>> => {
    return fetchApi<ApiResponse<TaskHazard>>('/api/task-hazards', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  // Get all task hazard assessments
  getTaskHazards: async (): Promise<ApiResponse<TaskHazard[]>> => {
    return fetchApi<ApiResponse<TaskHazard[]>>('/api/task-hazards', {
      method: 'GET',
    });
  },

  // Get a specific task hazard assessment
  getTaskHazard: async (id: string): Promise<ApiResponse<TaskHazard>> => {
    return fetchApi<ApiResponse<TaskHazard>>(`/api/task-hazards/${id}`, {
      method: 'GET',
    });
  },

  // Update a task hazard assessment
  updateTaskHazard: async (id: string, taskData: Partial<TaskHazard>): Promise<ApiResponse<TaskHazard>> => {
    return fetchApi<ApiResponse<TaskHazard>>(`/api/task-hazards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  },

  // Delete a task hazard assessment
  deleteTaskHazard: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<ApiResponse<void>>(`/api/task-hazards/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Geo Fence API functions
 */
export const geoFenceApi = {
  // Get current geo fence settings
  getGeoFenceSettings: async (): Promise<ApiResponse<GeoFenceSettings>> => {
    return fetchApi<ApiResponse<GeoFenceSettings>>('/api/geo-fence-settings', {
      method: 'GET',
    });
  },

  // Update geo fence settings
  updateGeoFenceSettings: async (settings: GeoFenceSettings): Promise<ApiResponse<GeoFenceSettings>> => {
    return fetchApi<ApiResponse<GeoFenceSettings>>('/api/geo-fence-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

export default {
  taskHazardApi,
  geoFenceApi,
}; 