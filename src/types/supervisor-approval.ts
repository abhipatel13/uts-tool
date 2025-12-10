// Supervisor approval related types and interfaces
import { Risk } from "./risk";

// Supervisor interface
export interface Supervisor {
  id: string | number; // Backend returns numeric IDs
  name: string;
  email: string;
  role: string;
}

// Approval status enumeration
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovableType = 'task_hazards' | 'risk_assessments';

// Individual interface for consistency across entities
export interface Individual {
  id: string | number; // Backend returns numeric IDs
  email: string;
  name: string;
  role?: string;
}

// Risk snapshot for approval history
export interface RiskSnapshot {
  id?: string;
  riskDescription: string;
  riskType?: string;
  asIsLikelihood?: string;
  asIsConsequence?: string;
  mitigatingAction: string;
  mitigatingActionType?: string;
  mitigatedLikelihood?: string;
  mitigatedConsequence?: string;
  requiresSupervisorSignature?: boolean;
}

// Base assessment snapshot interface
export interface BaseAssessmentSnapshot {
  id: string | number; // Backend returns numeric IDs
  date: string;
  time?: string;
  scopeOfWork: string;
  location?: string;
  status?: string;
  individuals?: Individual[];
  supervisor?: Individual;
  snapshotTakenAt?: string;
  risks?: RiskSnapshot[];
}

// Task hazard specific snapshot
export interface TaskHazardSnapshot extends BaseAssessmentSnapshot {
  type: 'task_hazards';
  systemLockoutRequired?: boolean;
  trainedWorkforce?: boolean;
  geoFenceLimit?: number;
  assetHierarchyId?: number;
}

// Risk assessment specific snapshot
export interface RiskAssessmentSnapshot extends BaseAssessmentSnapshot {
  type: 'risk_assessments';
  assetHierarchyId?: number;
}

// Unified assessment snapshot (discriminated union)
export type AssessmentSnapshot = TaskHazardSnapshot | RiskAssessmentSnapshot;

// Base approval interface
export interface BaseApproval {
  id: number;
  status: ApprovalStatus;
  createdAt: string;
  processedAt: string | null;
  comments: string;
  isInvalidated: boolean;
  isLatest: boolean;
  supervisor: Supervisor;
  approvableId: number;
  risksSnapshot?: RiskSnapshot[];
}

// Task hazard approval
export interface TaskHazardApproval extends BaseApproval {
  approvableType: 'task_hazards';
  approvableSnapshot: TaskHazardSnapshot;
}

// Risk assessment approval
export interface RiskAssessmentApproval extends BaseApproval {
  approvableType: 'risk_assessments';
  approvableSnapshot: RiskAssessmentSnapshot;
}

// Discriminated union for approvals
export type Approval = TaskHazardApproval | RiskAssessmentApproval;

// Base entity with approvals interface
export interface BaseEntityWithApprovals {
  id: string | number; // Backend returns numeric IDs
  date: string;
  time: string;
  scopeOfWork: string;
  location: string;
  status: string;
  risks: Risk[];
  individuals: Individual[];
  supervisor: string;
  approvals: Approval[];
  latestApproval?: Approval;
}

// Task hazard with approvals
export interface TaskHazardWithApprovals extends BaseEntityWithApprovals {
  approvableType: 'task_hazards';
  systemLockoutRequired: boolean;
  trainedWorkforce: boolean;
  geoFenceLimit?: number;
  assetSystem: string;
  companyId?: number;
  company?: {
    id: number;
    name: string;
  };
}

// Risk assessment with approvals
export interface RiskAssessmentWithApprovals extends BaseEntityWithApprovals {
  approvableType: 'risk_assessments';
  assetSystem: string;
  company_id?: number;
  company?: {
    id: number;
    name: string;
  };
}

// Discriminated union for entities with approvals
export type EntityWithApprovals = TaskHazardWithApprovals | RiskAssessmentWithApprovals;

// Polymorphic approvals response with proper typing
export interface PolymorphicApprovalsResponse {
  entities: EntityWithApprovals[];
  totalEntities: number;
  totalApprovals: number;
  filters: {
    status: string;
    type: string;
    includeInvalidated: boolean;
  };
}

// Approval history response
export interface ApprovalHistoryResponse {
  approvableId: number;
  approvableType: ApprovableType;
  entityName: string;
  totalApprovals: number;
  approvals: Approval[];
}

// Legacy interfaces for backward compatibility (deprecated)
/** @deprecated Use PolymorphicApprovalsResponse instead */
export interface ApprovalsResponse {
  taskHazards: TaskHazardWithApprovals[];
  totalTasks: number;
  totalApprovals: number;
  filters: {
    status: string;
    includeInvalidated: boolean;
  };
}



