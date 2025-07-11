import axios from 'axios';
import { getAuthToken } from '@/utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json'
});

// Helper function to handle API errors
const handleApiError = (error: unknown, defaultMessage: string) => {
  if (axios.isAxiosError(error)) {
    throw new Error(error.response?.data?.message || defaultMessage);
  }
  throw error;
};

// =================== TYPE DEFINITIONS ===================

export interface LicensePool {
  id: number;
  poolName: string;
  purchasedBy: number;
  totalLicenses: number;
  allocatedLicenses: number;
  availableLicenses: number;
  licenseType: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  validityPeriodMonths: number;
  totalAmount: number;
  pricePerLicense: number;
  purchaseDate: string;
  poolExpiryDate?: string;
  status: 'active' | 'expired' | 'suspended';
  companyId?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  purchaser?: {
    id: number;
    name: string;
    email: string;
  };
  company?: {
    id: number;
    name: string;
  };
  allocations?: LicenseAllocation[];
}

export interface LicenseAllocation {
  id: number;
  licensePoolId: number;
  userId: number;
  allocatedBy: number;
  allocationDate: string;
  activationDate?: string;
  validFrom: string;
  validUntil: string;
  status: 'allocated' | 'active' | 'expired' | 'revoked' | 'suspended';
  autoRenew: boolean;
  renewalAttempts: number;
  lastRenewalDate?: string;
  usageMetrics?: Record<string, unknown>;
  features?: string[];
  restrictions?: Record<string, unknown>;
  notes?: string;
  revokedDate?: string;
  revokedBy?: number;
  revokedReason?: string;
  companyId?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  allocator?: {
    id: number;
    name: string;
    email: string;
  };
  licensePool?: {
    id: number;
    poolName: string;
    licenseType: string;
    status: string;
  };
}

export interface LicenseAnalytics {
  poolStatistics: {
    status: string;
    count: number;
    totalLicenses: number;
    allocatedLicenses: number;
    totalAmount: number;
  }[];
  allocationStatistics: {
    status: string;
    count: number;
  }[];
  expiringLicenses: LicenseAllocation[];
  recentActivity: LicenseAllocation[];
}

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
    try {
      const response = await axios.post(`${API_URL}/api/licenses/pools`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create license pool');
    }
  },

  // Get all license pools
  getAllLicensePools: async (filters?: {
    status?: string;
    licenseType?: string;
    companyId?: number;
  }) => {
    try {
      const params = new URLSearchParams();
      console.log("params",params);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.licenseType) params.append('licenseType', filters.licenseType);
      if (filters?.companyId) params.append('companyId', filters.companyId.toString());

      const response = await axios.get(`${API_URL}/api/licenses/pools?${params.toString()}`, {
        headers: getAuthHeaders(),
        timeout: 8000, // 8 second timeout
      });
      console.log("response",response);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch license pools');
    }
  },

  // Get single license pool by ID
  getLicensePoolById: async (poolId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/licenses/pools/${poolId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch license pool');
    }
  },

  // Update license pool
  updateLicensePool: async (poolId: number, data: {
    poolName?: string;
    notes?: string;
    status?: string;
    poolExpiryDate?: string;
  }) => {
    try {
      const response = await axios.put(`${API_URL}/api/licenses/pools/${poolId}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update license pool');
    }
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
    try {
      console.log('API_URL:', API_URL);
      console.log('Sending allocation request:', data);
      
      const response = await axios.post(`${API_URL}/api/licenses/allocations`, data, {
        headers: getAuthHeaders(),
        timeout: 15000, // 15 second timeout
      });
      
      console.log('Allocation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('License allocation error:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - please check if the backend server is running');
        }
        if (error.response?.status === 404) {
          throw new Error('License allocation endpoint not found - please check backend API');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication failed - please login again');
        }
        if (error.response?.status === 500) {
          throw new Error('Server error - please try again later');
        }
      }
      handleApiError(error, 'Failed to allocate license');
    }
  },

  // Get all license allocations
  getAllAllocations: async (filters?: {
    status?: string;
    licensePoolId?: number;
    userId?: number;
    search?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.licensePoolId) params.append('licensePoolId', filters.licensePoolId.toString());
      if (filters?.userId) params.append('userId', filters.userId.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await axios.get(`${API_URL}/api/licenses/allocations?${params.toString()}`, {
        headers: getAuthHeaders(),
        timeout: 8000, // 8 second timeout
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch license allocations');
    }
  },

  // Get user license status
  getUserLicenseStatus: async (userId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/licenses/users/${userId}/status`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch user license status');
    }
  },

  // Revoke license
  revokeLicense: async (allocationId: number, reason?: string) => {
    try {
      const response = await axios.delete(`${API_URL}/api/licenses/allocations/${allocationId}`, {
        headers: getAuthHeaders(),
        data: { reason }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to revoke license');
    }
  },

  // Extend license
  extendLicense: async (allocationId: number, data: {
    newValidUntil: string;
    reason?: string;
  }) => {
    try {
      const response = await axios.put(`${API_URL}/api/licenses/allocations/${allocationId}/extend`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to extend license');
    }
  }
};

// =================== LICENSE ADMIN SERVICES ===================

export const LicenseAdminService = {
  // Get license analytics
  getLicenseAnalytics: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/licenses/analytics`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch license analytics');
    }
  },

  // Get expiring licenses (within next 30 days)
  getExpiringLicenses: async (days: number = 30) => {
    try {
      const response = await axios.get(`${API_URL}/api/licenses/expiring?days=${days}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch expiring licenses');
    }
  }
}; 