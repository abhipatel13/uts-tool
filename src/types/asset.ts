// Centralized asset-related types

// Main Asset interface (from api.ts)
export interface Asset {
  id: string;
  name: string;
  description: string;
  cmmsInternalId: string;
  functionalLocation: string;
  functionalLocationDesc: string;
  functionalLocationLongDesc: string;
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
  companyId?: number;  // Company ID for filtering
  company?: {
    id: number;
    name: string;
  };
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
  uploadId?: string;
  fileName: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
  errorMessage?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  updatedAt?: string;
  fileSize?: number;
  // Enhanced error details for failed uploads
  errors?: UploadError[];
  summary?: UploadSummary;
}

// Detailed error information for upload validation failures
export interface UploadError {
  row?: number;
  field?: string;
  value?: string;
  message: string;
}

// Summary of successful upload processing
export interface UploadSummary {
  totalRows: number;
  created: number;
  updated: number;
  processingTime?: string;
}

// Column mapping configuration for asset hierarchy uploads
export interface AssetColumnMappings {
  // Required fields
  id: string;           // Column header for unique identifier
  name: string;         // Column header for asset name
  // Optional fields
  parent_id?: string;   // Column header for parent asset reference
  description?: string;
  cmms_internal_id?: string;
  functional_location?: string;
  functional_location_desc?: string;
  functional_location_long_desc?: string;
  maintenance_plant?: string;
  cmms_system?: string;
  object_type?: string;
  system_status?: string;
  make?: string;
  manufacturer?: string;
  serial_number?: string;
}

// System field definition for mapping UI
export interface AssetFieldDefinition {
  key: keyof AssetColumnMappings;
  label: string;
  required: boolean;
  aliases: string[];  // Common column names to auto-guess
}