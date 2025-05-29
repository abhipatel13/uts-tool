export interface Asset {
  id: string;
  name: string;
  description: string;
  level: number;
  fmea: string;
  actions: string;
  criticalityAssessment: string;
  inspectionPoints: string;
  maintenancePlant: string;
  cmmsInternalId: string;
  functionalLocation: string;
  parent: string | null;
  cmmsSystem: string;
  siteReferenceName: string;
  functionalLocationDesc: string;
  functionalLocationLongDesc: string;
  objectType?: string;
  systemStatus: string;
  make?: string;
  manufacturer?: string;
  serialNumber?: string;
  primaryKey?: string;
}

interface ApiResponse<T> {
  status: boolean;
  data: T;
  message?: string;
}

interface CreateAssetRequest {
  assets: Asset[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const getAuthToken = () => localStorage.getItem('token');

const handleAuthError = (status: number) => {
  if (status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Authentication expired. Please login again.');
  }
};

export const assetHierarchyApi = {
  // Create new asset
  create: async (data: CreateAssetRequest): Promise<ApiResponse<Asset[]>> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      handleAuthError(response.status);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create asset');
    }

    return response.json();
  },

  // Upload CSV file
  uploadCSV: async (file: File): Promise<ApiResponse<Asset[]>> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy/upload-csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401) {
      handleAuthError(response.status);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload file');
    }

    return response.json();
  },

  // Get all assets
  getAll: async (): Promise<ApiResponse<Asset[]>> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 401) {
      handleAuthError(response.status);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch assets');
    }

    return response.json();
  },

  // Get single asset
  getOne: async (id: string): Promise<ApiResponse<Asset>> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 401) {
      handleAuthError(response.status);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch asset');
    }

    return response.json();
  },
}; 