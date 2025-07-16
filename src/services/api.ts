// API service for handling all API requests

import { getAuthToken } from "@/utils/auth";
import { logout as authLogout } from '@/utils/auth';

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
  geoFenceLimit?: number;
}

export interface RiskAssessment {
  id: string;
  date: string;
  time: string;
  scopeOfWork: string;
  assetSystem: string;
  systemLockoutRequired: boolean;
  trainedWorkforce: boolean;
  risks: Risk[];
  individuals: string;
  supervisor: string;
  status: string;
  location: string;
  createdBy?: string;
  createdOn?: string;
}

export interface GeoFenceSettings {
  limit: number;
}

export interface Asset {
  id: string;  // This will be the Functional Location
  internalId: string;  // CMMS Internal ID
  name: string;  // Functional Location Description
  description: string;  // Functional Location Long Description
  parent: string | null;  // Parent
  maintenancePlant: string;  // Maintenance Plant
  primaryKey: string;  // Primary Key
  cmmsSystem: string;  // CMMS System
  siteReference: string;  // Site Reference Name
  objectType: string;  // Object Type (Taxonomy Mapping Value)
  systemStatus: string;  // System Status
  make: string;
  manufacturer: string;
  serialNumber: string;
  level: number;  // Calculated based on hierarchy
  updatedAt: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type?: 'license' | 'payment' | 'system' | 'other' | 'approval' | 'risk' | 'task';
  isRead: boolean;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export enum UserRole {
  SUPER_USER = 'SUPER_USER',
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  USER = 'USER'
}

// API response structure
export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

/**
 * Generic function to make API requests
 */
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.code === "INVALID_TOKEN") {
      authLogout();
    }
    throw new Error(data.error || `API request failed with status ${response.status}`);
  }


  return data;
}

/**
 * Task Hazard API functions
 */
export const taskHazardApi = {
  // Create a new task hazard
  createTaskHazard: async (task: Omit<TaskHazard, 'id'>): Promise<TaskHazard> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task-hazards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(task),
    })

    if (!response.ok) {
      throw new Error('Failed to create task hazard')
    }

    const result = await response.json();
    return result;
  },

  // Get all task hazard assessments
  getTaskHazards: async (): Promise<ApiResponse<TaskHazard[]>> => {
    const response = await fetchApi<ApiResponse<TaskHazard[]>>('/api/task-hazards', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response;
  },

  // Get a specific task hazard assessment
  getTaskHazard: async (id: string): Promise<ApiResponse<TaskHazard>> => {
    const response = await fetchApi<ApiResponse<TaskHazard>>(`/api/task-hazards/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response;
  },

  // Update a task hazard assessment
  updateTaskHazard: async (id: string, taskData: Partial<TaskHazard>): Promise<ApiResponse<TaskHazard>> => {
    const response = await fetchApi<ApiResponse<TaskHazard>>(`/api/task-hazards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response;
  },

  // Approve or reject a task hazard assessment
  approveOrRejectTaskHazard: async (id: string, taskData: Partial<TaskHazard>): Promise<ApiResponse<TaskHazard>> => {
    const response = await fetchApi<ApiResponse<TaskHazard>>(`/api/task-hazards/approval/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response;
  },

  // Delete a task hazard assessment
  deleteTaskHazard: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetchApi<ApiResponse<void>>(`/api/task-hazards/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response;
  },
};

/**
 * Risk Assessment API functions
 */
export const riskAssessmentApi = {
  // Create a new risk assessment
  createRiskAssessment: async (assessment: Omit<RiskAssessment, 'id'>): Promise<RiskAssessment> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/risk-assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(assessment),
    });

    if (!response.ok) {
      throw new Error('Failed to create risk assessment');
    }

    const result = await response.json();
    return result;
  },

  // Get all risk assessments
  getRiskAssessments: async (): Promise<ApiResponse<RiskAssessment[]>> => {
    const response = await fetchApi<ApiResponse<RiskAssessment[]>>('/api/risk-assessments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response;
  },

  // Get a specific risk assessment
  getRiskAssessment: async (id: string): Promise<ApiResponse<RiskAssessment>> => {
    const response = await fetchApi<ApiResponse<RiskAssessment>>(`/api/risk-assessments/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response;
  },

  // Update a risk assessment
  updateRiskAssessment: async (id: string, assessmentData: Partial<RiskAssessment>): Promise<ApiResponse<RiskAssessment>> => {
    const response = await fetchApi<ApiResponse<RiskAssessment>>(`/api/risk-assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assessmentData),
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response;
  },

  // Delete a risk assessment
  deleteRiskAssessment: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetchApi<ApiResponse<void>>(`/api/risk-assessments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response;
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
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
  },

  // Update geo fence settings
  updateGeoFenceSettings: async (settings: GeoFenceSettings): Promise<ApiResponse<GeoFenceSettings>> => {
    return fetchApi<ApiResponse<GeoFenceSettings>>('/api/geo-fence-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
  },
};

/**
 * Asset Hierarchy API functions
 */
export const assetHierarchyApi = {
  // Get all assets
  getAll: async (): Promise<ApiResponse<Asset[]>> => {
    return fetchApi<ApiResponse<Asset[]>>('/api/asset-hierarchy', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
  },

  // Get a specific asset
  getOne: async (id: string): Promise<ApiResponse<Asset>> => {
    return fetchApi<ApiResponse<Asset>>(`/api/asset-hierarchy/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
  },

  // Upload CSV file
  uploadCSV: async (file: File): Promise<ApiResponse<Asset[]>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchApi<ApiResponse<Asset[]>>('/api/asset-hierarchy/upload-csv', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, let the browser set it with the boundary
      headers: {},
    });
  },
};

/**
 * Notification API functions
 */
export const notificationApi = {
  // Get user's notifications
  getMyNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    return fetchApi<ApiResponse<Notification[]>>('/api/notifications/my-notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
  },

  // Mark notification as read
  markAsRead: async (notificationId: number): Promise<ApiResponse<void>> => {
    return fetchApi<ApiResponse<void>>(`/api/notifications/${notificationId}/mark-read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
  },
};

const api = {
  taskHazardApi,
  riskAssessmentApi,
  geoFenceApi,
  assetHierarchyApi,
  notificationApi,
};

export default api;