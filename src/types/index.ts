// Centralized type exports - single import point for all types

// API types
export * from './api';
export * from './user';

// Domain-specific types
export * from './risk';
export * from './task-hazard';
export * from './supervisor-approval';
export * from './asset';
export * from './license';
export * from './notification';
export * from './tactics';
export * from './ui';
export * from './type-guards';

// Re-export commonly used types for convenience
export type { User } from './user';
export type { ApiResponse } from './api';
export type { Risk, RiskType, RiskAssessment } from './risk';
export type { TaskHazard } from './task-hazard';
export type { 
  Supervisor, 
  Approval, 
  ApprovalStatus, 
  AssessmentSnapshot, 
  TaskHazardSnapshot,
  RiskAssessmentSnapshot,
  ApprovableType,
  EntityWithApprovals,
  TaskHazardWithApprovals,
  RiskAssessmentWithApprovals,
  PolymorphicApprovalsResponse,
  Individual
} from './supervisor-approval';
export type { Asset, UploadStatus } from './asset';
export type { LicensePool, LicenseAllocation, UserLicenseStatus } from './license';
export type { Notification } from './notification';
export type { Tactic, CreateTacticRequest } from './tactics';
export type { NavItem, DashboardItem, QuickAction } from './ui';

// Re-export type guards
export {
  isTaskHazardApproval,
  isRiskAssessmentApproval,
  isTaskHazardWithApprovals,
  isRiskAssessmentWithApprovals,
  isTaskHazardSnapshot,
  isRiskAssessmentSnapshot,
  getEntityType,
  getEntityDisplayName,
  isValidEntityWithApprovals,
  isValidApproval
} from './type-guards';
