// Centralized task hazard types (updated to use centralized Risk interface)

import { Risk } from "./risk";
import { ApiResponse, ApprovalStatus } from "./api";

// Main TaskHazard interface (consolidated from api.ts and task-hazard.ts)
export interface TaskHazard {
  id: string;
  date: string;
  time: string;
  scopeOfWork: string;
  assetSystem: string;
  systemLockoutRequired: boolean;
  trainedWorkforce: string;
  risks: Risk[];
  individual: string;
  supervisor: string;
  status: string;
  location: string;
  geoFenceLimit?: number;
}

// Supervisor interface
export interface Supervisor {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Task hazard snapshot for approvals
export interface TaskHazardSnapshot {
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

// Approval interface
export interface Approval {
  id: number;
  status: ApprovalStatus;
  createdAt: string;
  processedAt: string | null;
  comments: string;
  isInvalidated: boolean;
  isLatest: boolean;
  supervisor: Supervisor;
  taskHazardData: TaskHazardSnapshot;
}

// Task hazard with approvals
export interface TaskHazardWithApprovals extends TaskHazard {
  approvals: Approval[];
}

// Approvals response
export interface ApprovalsResponse {
  taskHazards: TaskHazardWithApprovals[];
  totalTasks: number;
  totalApprovals: number;
  filters: {
    status: string;
    includeInvalidated: boolean;
  };
}

// Task hazard response wrapper
export type TaskHazardResponse = ApiResponse<TaskHazard>;

// Task hazard with geo fence (for specific pages)
export interface TaskHazardWithGeoFence extends TaskHazard {
  geoFenceLimit?: number;
}
