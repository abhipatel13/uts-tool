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

  // Get assets by company (for universal users)
  getByCompany: async (companyId: string): Promise<ApiResponse<Asset[]>> => {
    return api.get<ApiResponse<Asset[]>>(`/api/asset-hierarchy/company/${companyId}`);
  },

  // Get a specific asset
  getOne: async (id: string): Promise<ApiResponse<Asset>> => {
    return api.get<ApiResponse<Asset>>(`/api/asset-hierarchy/${id}`);
  },

  // Upload CSV file
  uploadCSV: async (file: File): Promise<ApiResponse<UploadStatus>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    
    // Don't manually set Content-Type for FormData - let browser set it with proper boundary
    return api.post<ApiResponse<UploadStatus>>('/api/asset-hierarchy/upload-csv', formData);
  },

  // Get upload status by ID
  getUploadStatus: async (uploadId: string): Promise<ApiResponse<UploadStatus>> => {
    return api.get<ApiResponse<UploadStatus>>(`/api/asset-hierarchy/upload-status/${uploadId}`);
  },

  // Get upload history
  getUploadHistory: async (): Promise<ApiResponse<UploadStatus[]>> => {
    return api.get<ApiResponse<UploadStatus[]>>('/api/asset-hierarchy/upload-history');
  },

  // Delete an asset (Universal User - all companies)
  deleteAssetUniversal: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/api/asset-hierarchy/universal/${id}`);
  },
}; 