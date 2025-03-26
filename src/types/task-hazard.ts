export type RiskLevel = 'Very Unlikely' | 'Unlikely' | 'Likely' | 'Very Likely';
export type ConsequenceLevel = 'Minor' | 'Moderate' | 'Serious' | 'Critical';

export interface Risk {
  riskDescription: string;
  riskType: string;
  asIsLikelihood: RiskLevel;
  asIsConsequence: ConsequenceLevel;
  mitigatingAction: string;
  mitigatingActionType: string;
  mitigatedLikelihood: RiskLevel;
  mitigatedConsequence: ConsequenceLevel;
  requiresSupervisorSignature: boolean;
}

export interface TaskHazard {
  id: string;
  date: string;
  time: string;
  scopeOfWork: string;
  assetSystem: string;
  systemLockoutRequired: boolean;
  trainedWorkforce: string;
  individual: string;
  supervisor: string;
  location: string;
  risks: Risk[];
  geoFenceLimit?: number;
}

export interface TaskHazardResponse {
  success: boolean;
  data?: TaskHazard;
  error?: string;
} 