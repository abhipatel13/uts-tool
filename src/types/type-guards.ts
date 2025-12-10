// Type guard utilities for supervisor approval entities
// These functions provide runtime type checking for discriminated unions

import type {
  ApprovableType,
  Approval,
  TaskHazardApproval,
  RiskAssessmentApproval,
  EntityWithApprovals,
  TaskHazardWithApprovals,
  RiskAssessmentWithApprovals,
  AssessmentSnapshot,
  TaskHazardSnapshot,
  RiskAssessmentSnapshot,
} from './supervisor-approval';

// Type guards for approval types
export function isTaskHazardApproval(approval: Approval): approval is TaskHazardApproval {
  return approval.approvableType === 'task_hazards';
}

export function isRiskAssessmentApproval(approval: Approval): approval is RiskAssessmentApproval {
  return approval.approvableType === 'risk_assessments';
}

// Type guards for entity types
export function isTaskHazardWithApprovals(entity: EntityWithApprovals): entity is TaskHazardWithApprovals {
  return entity.approvableType === 'task_hazards';
}

export function isRiskAssessmentWithApprovals(entity: EntityWithApprovals): entity is RiskAssessmentWithApprovals {
  return entity.approvableType === 'risk_assessments';
}

// Type guards for snapshot types
export function isTaskHazardSnapshot(snapshot: AssessmentSnapshot): snapshot is TaskHazardSnapshot {
  return snapshot.type === 'task_hazards';
}

export function isRiskAssessmentSnapshot(snapshot: AssessmentSnapshot): snapshot is RiskAssessmentSnapshot {
  return snapshot.type === 'risk_assessments';
}

// Helper function to determine entity type from unknown object
export function getEntityType(entity: unknown): ApprovableType {
  // Primary method: use approvableType if available
  if (
    entity &&
    typeof entity === 'object' &&
    entity !== null &&
    'approvableType' in entity &&
    typeof (entity as Record<string, unknown>).approvableType === 'string' &&
    ((entity as Record<string, unknown>).approvableType === 'task_hazards' || 
     (entity as Record<string, unknown>).approvableType === 'risk_assessments')
  ) {
    return (entity as Record<string, unknown>).approvableType as ApprovableType;
  }
  
  // Fallback: check for task hazard specific properties
  if (
    entity &&
    typeof entity === 'object' &&
    entity !== null &&
    ('systemLockoutRequired' in entity || 'trainedWorkforce' in entity)
  ) {
    return 'task_hazards';
  }
  
  // Default fallback (should not happen with proper backend responses)
  console.warn('Unable to determine entity type, defaulting to task_hazards:', entity);
  return 'task_hazards';
}

// Helper function to safely cast entity to specific type
export function castToTaskHazard(entity: EntityWithApprovals): TaskHazardWithApprovals | null {
  return isTaskHazardWithApprovals(entity) ? entity : null;
}

export function castToRiskAssessment(entity: EntityWithApprovals): RiskAssessmentWithApprovals | null {
  return isRiskAssessmentWithApprovals(entity) ? entity : null;
}

// Helper function to get entity display name
export function getEntityDisplayName(entityType: ApprovableType): string {
  return entityType === 'task_hazards' ? 'Task Hazard' : 'Risk Assessment';
}

// Helper function to validate entity structure
export function isValidEntityWithApprovals(entity: unknown): entity is EntityWithApprovals {
  return Boolean(
    entity &&
    typeof entity === 'object' &&
    entity !== null &&
    'id' in entity &&
    // Accept both string and number IDs
    (typeof (entity as Record<string, unknown>).id === 'string' || 
     typeof (entity as Record<string, unknown>).id === 'number') &&
    'approvableType' in entity &&
    typeof (entity as Record<string, unknown>).approvableType === 'string' &&
    ((entity as Record<string, unknown>).approvableType === 'task_hazards' || 
     (entity as Record<string, unknown>).approvableType === 'risk_assessments') &&
    'approvals' in entity &&
    Array.isArray((entity as Record<string, unknown>).approvals) &&
    'risks' in entity &&
    Array.isArray((entity as Record<string, unknown>).risks) &&
    'scopeOfWork' in entity &&
    typeof (entity as Record<string, unknown>).scopeOfWork === 'string'
  );
}

// Helper function to validate approval structure
export function isValidApproval(approval: unknown): approval is Approval {
  return Boolean(
    approval &&
    typeof approval === 'object' &&
    approval !== null &&
    'id' in approval &&
    typeof (approval as Record<string, unknown>).id === 'number' &&
    'status' in approval &&
    typeof (approval as Record<string, unknown>).status === 'string' &&
    ['pending', 'approved', 'rejected'].includes((approval as Record<string, unknown>).status as string) &&
    'approvableType' in approval &&
    typeof (approval as Record<string, unknown>).approvableType === 'string' &&
    ((approval as Record<string, unknown>).approvableType === 'task_hazards' || 
     (approval as Record<string, unknown>).approvableType === 'risk_assessments') &&
    'supervisor' in approval &&
    (approval as Record<string, unknown>).supervisor &&
    typeof (approval as Record<string, unknown>).supervisor === 'object'
  );
}
