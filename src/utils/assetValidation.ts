/**
 * Asset Hierarchy Validation Utilities
 * Provides detection algorithms for cycles, orphans, and duplicates
 */

import { AssetColumnMappings } from '@/types/asset';
import {
  ParsedAsset,
  ValidationResult,
  CycleInfo,
  OrphanGroup,
  OrphanInfo,
  DuplicateInfo,
  MissingNameInfo,
  ParsedAssetWithErrors,
} from '@/types/validation';

// ============================================================================
// Asset Parsing
// ============================================================================

/**
 * Parse raw file data into structured assets using column mappings
 */
export function parseAssetsFromData(
  data: string[][],
  headers: string[],
  mappings: AssetColumnMappings
): ParsedAsset[] {
  if (data.length <= 1) return []; // No data rows (only header)

  const getColumnIndex = (columnName: string | undefined): number => {
    if (!columnName) return -1;
    return headers.findIndex(h => h === columnName);
  };

  const idIndex = getColumnIndex(mappings.id);
  const nameIndex = getColumnIndex(mappings.name);
  const parentIdIndex = getColumnIndex(mappings.parent_id);

  if (idIndex < 0 || nameIndex < 0) {
    throw new Error('ID and Name columns must be mapped');
  }

  const assets: ParsedAsset[] = [];

  // Start from index 1 to skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.every(cell => !cell || cell.trim() === '')) continue;

    const id = (row[idIndex] || '').trim();
    const name = (row[nameIndex] || '').trim();
    const parentId = parentIdIndex >= 0 ? (row[parentIdIndex] || '').trim() : null;

    if (!id) continue; // Skip rows without ID

    assets.push({
      row: i + 1, // 1-based row number for display (accounting for header)
      id,
      name,
      parentId: parentId || null,
      originalRowData: row,
    });
  }

  return assets;
}

// ============================================================================
// Cycle Detection (DFS with Coloring)
// ============================================================================

/**
 * Detect circular dependencies using DFS with three-color marking
 * WHITE (0) = unvisited, GRAY (1) = in current path, BLACK (2) = fully processed
 */
export function detectCycles(assets: ParsedAsset[]): CycleInfo[] {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  // Build lookup maps
  const idToAsset = new Map<string, ParsedAsset>();
  assets.forEach(a => idToAsset.set(a.id, a));

  // Track colors and paths
  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  assets.forEach(a => color.set(a.id, WHITE));

  const cycles: CycleInfo[] = [];
  const processedCycleIds = new Set<string>(); // Avoid duplicate cycle detection

  function dfs(assetId: string, path: string[]): void {
    color.set(assetId, GRAY);
    const asset = idToAsset.get(assetId);

    if (asset?.parentId && idToAsset.has(asset.parentId)) {
      // Special case: self-reference (asset is its own parent)
      if (asset.parentId === assetId) {
        const sortedCycleIds = assetId;
        if (!processedCycleIds.has(sortedCycleIds)) {
          processedCycleIds.add(sortedCycleIds);
          cycles.push({
            cycleId: `cycle-${cycles.length + 1}`,
            assetIds: [assetId],
            rows: [asset.row],
            assetNames: [asset.name],
          });
        }
      } else {
        const parentColor = color.get(asset.parentId);

        if (parentColor === GRAY) {
          // Found a cycle - extract it
          const cycleStartIndex = path.indexOf(asset.parentId);
          if (cycleStartIndex >= 0) {
            const cyclePath = path.slice(cycleStartIndex);
            cyclePath.push(assetId);

            // Create a normalized cycle ID to detect duplicates
            const sortedCycleIds = [...cyclePath].sort().join(',');
            if (!processedCycleIds.has(sortedCycleIds)) {
              processedCycleIds.add(sortedCycleIds);

              cycles.push({
                cycleId: `cycle-${cycles.length + 1}`,
                assetIds: cyclePath,
                rows: cyclePath.map(id => idToAsset.get(id)!.row),
                assetNames: cyclePath.map(id => idToAsset.get(id)!.name),
              });
            }
          }
        } else if (parentColor === WHITE) {
          parent.set(asset.parentId, assetId);
          dfs(asset.parentId, [...path, assetId]);
        }
      }
    }

    color.set(assetId, BLACK);
  }

  // Run DFS from each unvisited node (handles disconnected components)
  assets.forEach(asset => {
    if (color.get(asset.id) === WHITE) {
      dfs(asset.id, []);
    }
  });

  return cycles;
}

// ============================================================================
// Orphan Detection
// ============================================================================

/**
 * Detect orphaned assets (parent_id references non-existent ID)
 * Groups orphans by their missing parent for better UX
 * Note: Uses case-SENSITIVE comparison - IDs must match exactly to prevent backend issues
 */
export function detectOrphans(assets: ParsedAsset[]): OrphanGroup[] {
  // Build set of all valid IDs (case-sensitive - must match exactly)
  const validIds = new Set(assets.map(a => a.id));

  // Find all orphans
  const orphansByMissingParent = new Map<string, OrphanInfo[]>();

  assets.forEach(asset => {
    // Case-sensitive check: parent ID must match an existing asset ID exactly
    if (asset.parentId && !validIds.has(asset.parentId)) {
      const orphanInfo: OrphanInfo = {
        assetId: asset.id,
        assetName: asset.name,
        row: asset.row,
        missingParentId: asset.parentId,
      };

      const existing = orphansByMissingParent.get(asset.parentId) || [];
      existing.push(orphanInfo);
      orphansByMissingParent.set(asset.parentId, existing);
    }
  });

  // Convert to array of groups
  const groups: OrphanGroup[] = [];
  orphansByMissingParent.forEach((orphans, missingParentId) => {
    groups.push({
      missingParentId,
      orphans: orphans.sort((a, b) => a.row - b.row),
    });
  });

  // Sort groups by number of orphans (most first)
  return groups.sort((a, b) => b.orphans.length - a.orphans.length);
}

// ============================================================================
// Duplicate Detection
// ============================================================================

/**
 * Detect duplicate IDs in the asset list
 */
export function detectDuplicates(assets: ParsedAsset[]): DuplicateInfo[] {
  // Use lowercase ID as key for case-insensitive comparison
  const idOccurrences = new Map<string, ParsedAsset[]>();

  assets.forEach(asset => {
    const normalizedId = asset.id.toLowerCase();
    const existing = idOccurrences.get(normalizedId) || [];
    existing.push(asset);
    idOccurrences.set(normalizedId, existing);
  });

  const duplicates: DuplicateInfo[] = [];
  idOccurrences.forEach((assetList, normalizedId) => {
    if (assetList.length > 1) {
      duplicates.push({
        // Store the normalized (lowercase) ID for consistent comparison
        id: normalizedId,
        rows: assetList.map(a => a.row).sort((a, b) => a - b),
        names: assetList.map(a => a.name),
        // Store original IDs so we can display what the user actually entered
        originalIds: assetList.map(a => a.id),
      });
    }
  });

  // Sort by number of duplicates (most first)
  return duplicates.sort((a, b) => b.rows.length - a.rows.length);
}

// ============================================================================
// Missing Name Detection
// ============================================================================

/**
 * Detect assets with missing or empty names
 */
export function detectMissingNames(assets: ParsedAsset[]): MissingNameInfo[] {
  const missingNames: MissingNameInfo[] = [];

  assets.forEach(asset => {
    if (!asset.name || asset.name.trim() === '') {
      missingNames.push({
        assetId: asset.id,
        row: asset.row,
        parentId: asset.parentId,
      });
    }
  });

  // Sort by row number
  return missingNames.sort((a, b) => a.row - b.row);
}

// ============================================================================
// Combined Validation
// ============================================================================

/**
 * Run all validations and return combined result
 */
export function validateAssets(
  data: string[][],
  headers: string[],
  mappings: AssetColumnMappings
): ValidationResult {
  const assets = parseAssetsFromData(data, headers, mappings);
  return validateParsedAssets(assets);
}

/**
 * Run all validations on pre-parsed assets
 * Useful for re-validation after fixes
 */
export function validateParsedAssets(assets: ParsedAsset[]): ValidationResult {
  const cycles = detectCycles(assets);
  const orphanGroups = detectOrphans(assets);
  const duplicates = detectDuplicates(assets);
  const missingNames = detectMissingNames(assets);

  // Count assets with errors
  const cycleAssetIds = new Set(cycles.flatMap(c => c.assetIds));
  const orphanAssetIds = new Set(orphanGroups.flatMap(g => g.orphans.map(o => o.assetId)));

  // Count unique assets with any error
  const assetsWithErrors = new Set<string>();
  cycleAssetIds.forEach(id => assetsWithErrors.add(id));
  orphanAssetIds.forEach(id => assetsWithErrors.add(id));
  duplicates.forEach(d => assetsWithErrors.add(d.id));
  missingNames.forEach(m => assetsWithErrors.add(m.assetId));

  const totalErrorCount = 
    cycles.length + 
    orphanGroups.reduce((sum, g) => sum + g.orphans.length, 0) + 
    duplicates.reduce((sum, d) => sum + d.rows.length, 0) +
    missingNames.length;

  return {
    totalAssets: assets.length,
    validAssets: assets.length - assetsWithErrors.size,
    cycles,
    orphanGroups,
    duplicates,
    missingNames,
    hasErrors: cycles.length > 0 || orphanGroups.length > 0 || duplicates.length > 0 || missingNames.length > 0,
    totalErrorCount,
  };
}

// ============================================================================
// Error Enrichment (for table display)
// ============================================================================

/**
 * Enrich parsed assets with error information for table display
 */
export function enrichAssetsWithErrors(
  assets: ParsedAsset[],
  validationResult: ValidationResult,
  modifiedRows: Set<number> = new Set(),
  deletedRows: Set<number> = new Set()
): ParsedAssetWithErrors[] {
  // Build lookup sets for O(1) error checking
  const duplicateRows = new Set(validationResult.duplicates.flatMap(d => d.rows));
  const orphanRows = new Set(
    validationResult.orphanGroups.flatMap(g => g.orphans.map(o => o.row))
  );
  const cycleRows = new Set(validationResult.cycles.flatMap(c => c.rows));
  const missingNameRows = new Set(validationResult.missingNames.map(m => m.row));

  return assets.map(asset => {
    const isDuplicate = duplicateRows.has(asset.row);
    const isOrphan = orphanRows.has(asset.row);
    const inCycle = cycleRows.has(asset.row);
    const hasMissingName = missingNameRows.has(asset.row);
    const errorMessages: string[] = [];

    if (isDuplicate) {
      const dupInfo = validationResult.duplicates.find(d => d.rows.includes(asset.row));
      if (dupInfo) {
        errorMessages.push(`Duplicate ID: appears on rows ${dupInfo.rows.join(', ')}`);
      }
    }

    if (isOrphan) {
      const orphanGroup = validationResult.orphanGroups.find(g =>
        g.orphans.some(o => o.row === asset.row)
      );
      if (orphanGroup) {
        errorMessages.push(`Orphan: parent "${orphanGroup.missingParentId}" not found`);
      }
    }

    if (inCycle) {
      const cycleInfo = validationResult.cycles.find(c => c.rows.includes(asset.row));
      if (cycleInfo) {
        errorMessages.push(`In cycle: ${cycleInfo.assetIds.join(' → ')} → ${cycleInfo.assetIds[0]}`);
      }
    }

    if (hasMissingName) {
      errorMessages.push('Missing name: asset name is required');
    }

    return {
      ...asset,
      errors: {
        isDuplicate,
        isOrphan,
        inCycle,
        hasMissingName,
        errorMessages,
      },
      isModified: modifiedRows.has(asset.row),
      isDeleted: deletedRows.has(asset.row),
    };
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all children of a specific parent ID
 */
export function getChildrenOfParent(assets: ParsedAsset[], parentId: string): ParsedAsset[] {
  return assets.filter(a => a.parentId === parentId);
}

/**
 * Count children of a specific parent ID
 */
export function countChildren(assets: ParsedAsset[], parentId: string): number {
  return assets.filter(a => a.parentId === parentId).length;
}

/**
 * Topologically sort assets so parents always appear before their children
 * This ensures the backend can process them in order without missing parent references
 */
export function topologicalSortAssets(assets: ParsedAsset[]): ParsedAsset[] {
  // Build lookup maps
  const idToAsset = new Map<string, ParsedAsset>();
  assets.forEach(a => idToAsset.set(a.id, a));

  // Track which assets have been added to result
  const added = new Set<string>();
  // Track assets currently being visited (to detect cycles)
  const visiting = new Set<string>();
  const result: ParsedAsset[] = [];

  // Helper function to add an asset and its ancestors first
  function addWithAncestors(asset: ParsedAsset): void {
    if (added.has(asset.id)) return;
    
    // If we're already visiting this asset, we have a cycle - skip to break it
    if (visiting.has(asset.id)) return;
    
    // Mark as currently visiting
    visiting.add(asset.id);

    // If this asset has a parent, add the parent first (recursively)
    if (asset.parentId && idToAsset.has(asset.parentId) && !added.has(asset.parentId)) {
      const parent = idToAsset.get(asset.parentId)!;
      addWithAncestors(parent);
    }

    // Now add this asset
    if (!added.has(asset.id)) {
      added.add(asset.id);
      result.push(asset);
    }
    
    // Done visiting
    visiting.delete(asset.id);
  }

  // First, add all root assets (no parent or parent not in file)
  const rootAssets = assets.filter(a => !a.parentId || !idToAsset.has(a.parentId));
  rootAssets.forEach(asset => {
    if (!added.has(asset.id)) {
      added.add(asset.id);
      result.push(asset);
    }
  });

  // Then process remaining assets, ensuring parents come first
  assets.forEach(asset => {
    addWithAncestors(asset);
  });

  return result;
}

/**
 * Generate CSV content from parsed assets with original column structure
 * Assets are topologically sorted so parents appear before children
 */
export function generateCSVFromAssets(
  assets: ParsedAsset[],
  headers: string[]
): string {
  // Topologically sort assets so parents come before children
  const sortedAssets = topologicalSortAssets(
    assets.filter(a => !('isDeleted' in a) || !(a as ParsedAssetWithErrors).isDeleted)
  );
  
  const headerLine = headers.map(h => escapeCSVValue(h)).join(',');
  const dataLines = sortedAssets
    .map(asset => asset.originalRowData.map(v => escapeCSVValue(v)).join(','));

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Escape a value for CSV output
 */
function escapeCSVValue(value: string): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

