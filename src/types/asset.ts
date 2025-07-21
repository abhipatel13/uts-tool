// Centralized asset-related types

// Main Asset interface (from api.ts)
export interface Asset {
  id: string;
  name: string;
  cmmsInternalId: string;
  functionalLocation: string;
  functionalLocationDescription: string;
  functionalLocationLongDescription: string;
  parent: string | null;  
  maintenancePlant: string;  
  cmmsSystem: string;  
  objectType: string;  // Object Type (Taxonomy Mapping Value)
  systemStatus: string;  
  make: string;
  manufacturer: string;
  serialNumber: string;
  level: number;  // Calculated based on hierarchy
  updatedAt: string;
  createdAt: string;
}

// Asset details for tactics (from tacticsApi.ts)
export interface AssetDetails {
  asset_id: string;
  manufacturer: string;
  model: string;
  asset_group: string;
  description: string;
  criticality: string;
  failure_mode: string;
  failure_cause: string;
  failure_effect: string;
  failure_evident: string;
  affects_safety: string;
  suitable_task: string;
  maintenance_strategy: string;
  controls: string;
  actions: string;
  responsibility: string;
  activity_name: string;
  activity_desc: string;
  activity_type: string;
  activity_cause: string;
  activity_source: string;
  tactic: string;
  shutdown: string;
  department: string;
  frequency: string;
  doc_number: string;
  doc_desc: string;
  picture: string;
  resource: string;
  hours: string;
  units: string;
  overhaul: string;
  shutdowns: string;
}

// Asset Data Loader Upload Status
export interface UploadStatus {
  id?: string;
  fileName: string;
  status: 'uploading' | 'completed' | 'error';
  uploadedBy?: string;
  uploadedAt?: string;
  fileSize?: number;
}