// Centralized license-related types (from licenseService.ts)

import { EntityStatus } from './api';

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
  status: EntityStatus;
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

// User license status response interface
export interface UserLicenseStatus {
  hasActiveLicense: boolean;
  activeAllocations: number;
  expiredAllocations: number;
  upcomingAllocations: number;
  totalAllocations: number;
}
