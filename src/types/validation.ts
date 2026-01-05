/**
 * Validation types for Asset Hierarchy Data Loader
 * Used for detecting and displaying cycles, orphans, and duplicates
 */

// ============================================================================
// Cycle Detection Types
// ============================================================================

/**
 * Information about a detected circular dependency
 */
export interface CycleInfo {
  /** Unique identifier for this cycle */
  cycleId: string;
  /** IDs of assets in the cycle (in order of the cycle path) */
  assetIds: string[];
  /** Row numbers of assets in the cycle (1-based for display) */
  rows: number[];
  /** Names of assets in the cycle */
  assetNames: string[];
}

// ============================================================================
// Orphan Detection Types
// ============================================================================

/**
 * Information about a single orphaned asset
 */
export interface OrphanInfo {
  /** ID of the orphaned asset */
  assetId: string;
  /** Name of the orphaned asset */
  assetName: string;
  /** Row number (1-based for display) */
  row: number;
  /** The parent_id value that doesn't exist */
  missingParentId: string;
}

/**
 * Group of orphans that reference the same missing parent
 */
export interface OrphanGroup {
  /** The parent ID that doesn't exist in the file */
  missingParentId: string;
  /** All assets that reference this missing parent */
  orphans: OrphanInfo[];
}

// ============================================================================
// Duplicate Detection Types
// ============================================================================

/**
 * Information about duplicate IDs
 */
export interface DuplicateInfo {
  /** The normalized (lowercase) ID value for comparison */
  id: string;
  /** Row numbers where this ID appears (1-based for display) */
  rows: number[];
  /** Names of assets with this duplicate ID */
  names: string[];
  /** Original IDs as entered by user (preserves case for display) */
  originalIds: string[];
}

// ============================================================================
// Missing Name Detection Types
// ============================================================================

/**
 * Information about assets with missing names
 */
export interface MissingNameInfo {
  /** Asset ID */
  assetId: string;
  /** Row number (1-based for display) */
  row: number;
  /** Parent ID if present */
  parentId: string | null;
}

// ============================================================================
// Combined Validation Result
// ============================================================================

/**
 * Complete validation result containing all detected issues
 */
export interface ValidationResult {
  /** Total number of assets in the file */
  totalAssets: number;
  /** Number of assets without any errors */
  validAssets: number;
  /** Detected circular dependencies */
  cycles: CycleInfo[];
  /** Detected orphaned assets (grouped by missing parent) */
  orphanGroups: OrphanGroup[];
  /** Detected duplicate IDs */
  duplicates: DuplicateInfo[];
  /** Assets with missing names */
  missingNames: MissingNameInfo[];
  /** Quick check if any errors exist */
  hasErrors: boolean;
  /** Total count of all errors */
  totalErrorCount: number;
}

// ============================================================================
// Parsed Asset Types (for validation processing)
// ============================================================================

/**
 * Simplified asset representation for validation
 */
export interface ParsedAsset {
  /** Row number in the original file (1-based) */
  row: number;
  /** Asset ID from the mapped column */
  id: string;
  /** Asset name from the mapped column */
  name: string;
  /** Parent ID (null if root asset or not mapped) */
  parentId: string | null;
  /** Original row data for regenerating the file */
  originalRowData: string[];
}

/**
 * Parsed asset with error status (for table display)
 */
export interface ParsedAssetWithErrors extends ParsedAsset {
  /** Error flags for this asset */
  errors: {
    isDuplicate: boolean;
    isOrphan: boolean;
    inCycle: boolean;
    hasMissingName: boolean;
    errorMessages: string[];
  };
  /** Whether this row has been modified by a fix */
  isModified: boolean;
  /** Whether this row is marked for deletion */
  isDeleted: boolean;
}

// ============================================================================
// Fix Operation Types (for Phase 2+)
// ============================================================================

/**
 * Types of fix operations that can be applied
 */
export type FixOperation =
  | { type: 'REMOVE_PARENT'; row: number }
  | { type: 'CHANGE_ID'; row: number; newId: string }
  | { type: 'DELETE_ROW'; row: number }
  | { type: 'CHANGE_PARENT'; row: number; newParentId: string | null };

/**
 * Child reassignment options when fixing duplicates
 */
export type ChildReassignment =
  | { type: 'KEEP_CURRENT' }
  | { type: 'MOVE_TO_NEW'; newParentId: string }
  | { type: 'REMOVE_PARENT' }
  | { type: 'DELETE_CHILDREN' }
  | { type: 'REASSIGN_TO_ROW'; targetRow: number }
  | { type: 'INDIVIDUAL'; assignments: Map<number, ChildAssignmentAction> };

/**
 * Individual child assignment action
 */
export type ChildAssignmentAction =
  | { type: 'KEEP_CURRENT' }
  | { type: 'MOVE_TO'; parentId: string }
  | { type: 'MAKE_ROOT' }
  | { type: 'DELETE' };

