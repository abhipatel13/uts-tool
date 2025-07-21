// Centralized risk-related types and interfaces

// Risk level types
export type RiskLevel = 'Very Unlikely' | 'Unlikely' | 'Likely' | 'Very Likely';
export type ConsequenceLevel = 'Minor' | 'Significant' | 'Serious' | 'Major' | 'Catastrophic';
export type RiskType = 'Personnel' | 'Maintenance' | 'Revenue' | 'Process' | 'Environmental';

// Unified Risk interface (consolidating from api.ts and task-hazard.ts)
export interface Risk {
  id?: string;
  riskDescription: string;
  riskType: RiskType;
  asIsLikelihood: string;
  asIsConsequence: string;
  mitigatingAction: string;
  mitigatedLikelihood: string;
  mitigatedConsequence: string;
  mitigatingActionType: string;
  requiresSupervisorSignature: boolean;
}

// Risk assessment related interfaces
export interface RiskAssessment {
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
  createdBy?: string;
  createdOn?: string;
}

// Risk matrix related types
export interface ConsequenceLabel {
  value: ConsequenceLevel;
  label: string;
  description: string;
  score: number;
}

export interface LikelihoodLabel {
  value: RiskLevel;
  label: string;
  description: string;
  score: number;
}

export interface RiskCategory {
  id: RiskType;
  label: string;
  color: string;
}