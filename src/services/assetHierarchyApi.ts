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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export const assetHierarchyApi = {
  // Create new asset
  create: async (data: CreateAssetRequest): Promise<ApiResponse<Asset[]>> => {
    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to create asset')
    }

    return response.json()
  },

  // Upload CSV file
  uploadCSV: async (file: File): Promise<ApiResponse<Asset[]>> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy/upload-csv`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload file')
    }

    return response.json()
  },

  // Get all assets
  getAll: async (): Promise<ApiResponse<Asset[]>> => {
    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch assets')
    }

    return response.json()
  },

  // Get single asset
  getOne: async (id: string): Promise<ApiResponse<Asset>> => {
    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy/${id}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch asset')
    }

    return response.json()
  },
} 