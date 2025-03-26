export interface Asset {
  id: string;
  name: string;
  description: string;
  level: number;
  parent: string | null;
  fmea: string;
  actions: string;
  criticalityAssessment: string;
  inspectionPoints: string;
  updatedAt: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export const assetHierarchyApi = {
  // Create new asset
  create: async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> => {
    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assetData),
    })

    if (!response.ok) {
      throw new Error('Failed to create asset')
    }

    return response.json()
  },

  // Upload CSV file
  uploadCSV: async (file: File): Promise<{ data: Asset[] }> => {
    const formData = new FormData()
    formData.append('file', file)
    console.log("Form Data:", formData);

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
  getAll: async (): Promise<{ data: Asset[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch assets')
    }

    return response.json()
  },

  // Get single asset
  getOne: async (id: string): Promise<Asset> => {
    const response = await fetch(`${API_BASE_URL}/api/asset-hierarchy/${id}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch asset')
    }

    return response.json()
  },
} 