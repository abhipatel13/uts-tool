import { api } from '@/lib/api-client';
import { ApiResponse, Asset, UploadStatus } from '@/types';

// Type for creating assets (excludes server-generated fields)
export type CreateAssetRequest = Omit<Asset, 'id' | 'updatedAt' | 'createdAt' | 'level'>;

export const AssetHierarchyApi = {
  // Create new asset
  create: async (data: { assets: CreateAssetRequest[] }): Promise<ApiResponse<Asset[]>> => {
    return api.post<ApiResponse<Asset[]>>('/api/asset-hierarchy', data);
  },

  // Get all assets
  getAll: async (): Promise<ApiResponse<Asset[]>> => {
    return api.get<ApiResponse<Asset[]>>('/api/asset-hierarchy');
  },

  // Get a specific asset
  getOne: async (id: string): Promise<ApiResponse<Asset>> => {
    return api.get<ApiResponse<Asset>>(`/api/asset-hierarchy/${id}`);
  },

  // Upload CSV file
  uploadCSV: async (file: File): Promise<ApiResponse<UploadStatus>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post<ApiResponse<UploadStatus>>('/api/asset-hierarchy/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get upload history
  getUploadHistory: async (): Promise<ApiResponse<UploadStatus[]>> => {
    return api.get<ApiResponse<UploadStatus[]>>('/api/asset-hierarchy/upload-history');
  },
}; 