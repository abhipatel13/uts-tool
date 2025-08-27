// Centralized service exports - single import point for all API services

// Core API client
export { api } from '@/lib/api-client';

// Domain-specific services
export * from './authApi';
export * from './taskHazardApi';
export * from './riskAssessmentApi';
export * from './assetHierarchyApi';
export * from './licenseService';
export * from './userApi';
export * from './notificationApi';
export * from './tacticsApi';
export * from './PaymentService';
export * from './BulkUserService';

// Re-export commonly used services for convenience
export { AuthApi } from './authApi';
export { TaskHazardApi } from './taskHazardApi';
export { RiskAssessmentApi } from './riskAssessmentApi';
export { AssetHierarchyApi } from './assetHierarchyApi';
export { LicensePoolService, LicenseAllocationService, LicenseAdminService } from './licenseService';
export { UserApi } from './userApi';
export { NotificationApi } from './notificationApi';
export { TacticsApi } from './tacticsApi';
export { PaymentService } from './PaymentService';
export { BulkUserService } from './BulkUserService';