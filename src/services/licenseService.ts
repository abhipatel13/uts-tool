import { api } from '@/lib/api-client';
import { ApiResponse, LicensePool, LicenseAllocation, LicenseAnalytics, UserLicenseStatus } from '@/types';

// =================== LICENSE POOL SERVICES ===================

export const LicensePoolService = {
  // Create a new license pool (bulk purchase)
  createLicensePool: async (data: {
    poolName: string;
    totalLicenses: number;
    licenseType: string;
    validityPeriodMonths: number;
    totalAmount: number;
    pricePerLicense: number;
    poolExpiryDate?: string;
    notes?: string;
    companyId?: number;
  }) => {
    return api.post<ApiResponse<LicensePool>>('/api/licenses/pools', data);
  },

  // Get all license pools
  getAllLicensePools: async (filters?: {
    status?: string;
    licenseType?: string;
    companyId?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.licenseType) params.append('licenseType', filters.licenseType);
    if (filters?.companyId) params.append('companyId', filters.companyId.toString());

    const queryString = params.toString();
    const endpoint = `/api/licenses/pools${queryString ? `?${queryString}` : ''}`;
    
    return api.get<ApiResponse<LicensePool[]>>(endpoint);
  },

  // Get single license pool by ID
  getLicensePoolById: async (poolId: number) => {
    return api.get<ApiResponse<LicensePool>>(`/api/licenses/pools/${poolId}`);
  },

  // Update license pool
  updateLicensePool: async (poolId: number, data: {
    poolName?: string;
    notes?: string;
    status?: string;
    poolExpiryDate?: string;
  }) => {
    return api.put<ApiResponse<LicensePool>>(`/api/licenses/pools/${poolId}`, data);
  }
};

// =================== LICENSE ALLOCATION SERVICES ===================

export const LicenseAllocationService = {
  // Allocate license to user
  allocateLicense: async (data: {
    licensePoolId: number;
    userId: number;
    validFrom: string;
    validUntil?: string;
    customValidityMonths?: number;
    autoRenew?: boolean;
    features?: string[];
    restrictions?: Record<string, unknown>;
    notes?: string;
  }) => {
    return api.post<ApiResponse<LicenseAllocation>>('/api/licenses/allocations', data);
  },

  // Get all license allocations
  getAllAllocations: async (filters?: {
    status?: string;
    licensePoolId?: number;
    userId?: number;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.licensePoolId) params.append('licensePoolId', filters.licensePoolId.toString());
    if (filters?.userId) params.append('userId', filters.userId.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = `/api/licenses/allocations${queryString ? `?${queryString}` : ''}`;
    
    return api.get<ApiResponse<LicenseAllocation[]>>(endpoint);
  },

  // Get user license status
  getUserLicenseStatus: async (userId: number) => {
    return api.get<ApiResponse<UserLicenseStatus>>(`/api/licenses/users/${userId}/status`);
  },

  // Revoke license
  revokeLicense: async (allocationId: number, reason?: string) => {
    return api.delete<ApiResponse<void>>(`/api/licenses/allocations/${allocationId}`, {
      body: { reason }
    });
  },

  // Extend license
  extendLicense: async (allocationId: number, data: {
    newValidUntil: string;
    reason?: string;
  }) => {
    return api.put<ApiResponse<LicenseAllocation>>(`/api/licenses/allocations/${allocationId}/extend`, data);
  }
};

// =================== LICENSE ADMIN SERVICES ===================

export const LicenseAdminService = {
  // Get license analytics
  getLicenseAnalytics: async () => {
    return api.get<ApiResponse<LicenseAnalytics>>('/api/licenses/analytics');
  },

  // Get expiring licenses (within next 30 days)
  getExpiringLicenses: async (days: number = 30) => {
    return api.get<ApiResponse<LicenseAllocation[]>>(`/api/licenses/expiring?days=${days}`);
  }
}; 