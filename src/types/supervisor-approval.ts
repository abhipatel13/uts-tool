// Supervisor approval related types and interfaces

// Supervisor interface
export interface Supervisor {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Approval status enumeration
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// Unified assessment snapshot for approvals (used for both task hazards and risk assessments)
export interface AssessmentSnapshot {
  id: string;
  date: string;
  scopeOfWork: string;
  risks: {
    id: string;
    riskDescription: string;
    riskType?: string;
    asIsLikelihood?: string;
    asIsConsequence?: string;
    mitigatingAction: string;
    mitigatingActionType?: string;
    mitigatedLikelihood?: string;
    mitigatedConsequence?: string;
    requiresSupervisorSignature?: boolean;
  }[];
}

// Legacy alias for backward compatibility
export type TaskHazardSnapshot = AssessmentSnapshot;

// Approval interface - Updated to support polymorphic entities
export interface Approval {
  id: number;
  status: ApprovalStatus;
  createdAt: string;
  processedAt: string | null;
  comments: string;
  isInvalidated: boolean;
  isLatest: boolean;
  supervisor: Supervisor;
  approvableId: number;          // New polymorphic field
  approvableType: 'task_hazards' | 'risk_assessments';  // New polymorphic field
  approvableSnapshot: AssessmentSnapshot;       // Uses unified snapshot structure
  // Deprecated: kept for backward compatibility
  taskHazardData?: AssessmentSnapshot;
}

// TaskHazardWithApprovals and RiskAssessmentWithApprovals are defined in their respective files

// Approvals response
export interface ApprovalsResponse {
  taskHazards: any[]; // Using any[] to avoid circular dependencies - specific types are handled at runtime
  totalTasks: number;
  totalApprovals: number;
  filters: {
    status: string;
    includeInvalidated: boolean;
  };
}

// Add polymorphic approval response
export interface PolymorphicApprovalsResponse {
  entities: any[]; // Using any[] to avoid circular dependencies - specific types are handled at runtime
  totalEntities: number;
  totalApprovals: number;
  filters: {
    status: string;
    includeInvalidated: boolean;
    approvableType?: string;
  };
}
