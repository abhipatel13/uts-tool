// Centralized task hazard types (updated to use centralized Risk interface)

import { Risk, RiskAssessmentWithApprovals } from "./risk";
import { 
  Supervisor, 
  Approval, 
  ApprovalStatus, 
  AssessmentSnapshot,
  TaskHazardSnapshot,
  ApprovalsResponse,
  PolymorphicApprovalsResponse 
} from "./supervisor-approval";

// Main TaskHazard interface (consolidated from api.ts and task-hazard.ts)
export interface TaskHazard {
  id: string;
  date: string;
  time: string;
  scopeOfWork: string;
  assetSystem: string;
  systemLockoutRequired: boolean;
  trainedWorkforce: boolean;
  risks: Risk[];
  individuals: string;
  supervisor: string;
  status: string;
  location: string;
  geoFenceLimit?: number;
  companyId?: number;  // Company ID for filtering
  company?: {
    id: number;
    name: string;
  };
  latestApproval?: Approval;
}

// Supervisor approval types are now imported from supervisor-approval.ts

// Task hazard with approvals
export interface TaskHazardWithApprovals extends TaskHazard {
  approvals: Approval[];
}

// Approval response types are now imported from supervisor-approval.ts


