"use client"

import { useState, useCallback, useMemo } from 'react'
import { AssetColumnMappings } from '@/types'
import {
  ParsedAsset,
  ValidationResult,
  OrphanGroup,
} from '@/types/validation'
import {
  parseAssetsFromData,
  validateParsedAssets,
  generateCSVFromAssets,
} from '@/utils/assetValidation'

// Valid parent option for selection
export interface ParentOption {
  id: string
  name: string
  row: number
}

// Child asset info for duplicate fixing
export interface ChildAssetInfo {
  row: number
  id: string
  name: string
  parentId: string
}

interface UseAssetValidationReturn {
  // State
  parsedAssets: ParsedAsset[]
  validationResult: ValidationResult | null
  modifiedRows: Set<number>
  deletedRows: Set<number>
  isValidating: boolean
  hasChanges: boolean
  
  // Initialization
  initializeValidation: (
    data: string[][],
    headers: string[],
    mappings: AssetColumnMappings
  ) => ValidationResult
  
  // Fix actions - Orphans
  removeParentId: (row: number) => void
  changeParentId: (row: number, newParentId: string) => void
  bulkRemoveOrphanParents: (orphanGroup: OrphanGroup) => void
  bulkRemoveAllOrphanParents: () => void
  getValidParentOptions: (excludeRow: number) => ParentOption[]
  
  // Fix actions - Cycles
  breakCycleAtRow: (row: number) => void
  breakAllCycles: () => void
  
  // Fix actions - Duplicates
  getChildrenOfAsset: (assetId: string, excludeRows?: number[]) => ChildAssetInfo[]
  changeAssetId: (row: number, newId: string) => void
  deleteRow: (row: number) => void
  undeleteRow: (row: number) => void
  reassignChildrenToParent: (childRows: number[], newParentId: string | null) => void
  
  // Utilities
  resetToOriginal: () => void
  getModifiedCSV: () => string
  
  // For clearing state
  clearState: () => void
}

export function useAssetValidation(headers: string[]): UseAssetValidationReturn {
  // Original data (unchanged, for reset)
  const [originalAssets, setOriginalAssets] = useState<ParsedAsset[]>([])
  
  // Current data (with modifications)
  const [parsedAssets, setParsedAssets] = useState<ParsedAsset[]>([])
  
  // Track modifications
  const [modifiedRows, setModifiedRows] = useState<Set<number>>(new Set())
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set())
  
  // Validation state
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Check if there are any changes
  const hasChanges = useMemo(() => 
    modifiedRows.size > 0 || deletedRows.size > 0,
    [modifiedRows, deletedRows]
  )

  // Re-run validation on current assets
  const revalidate = useCallback((assets: ParsedAsset[]) => {
    setIsValidating(true)
    const result = validateParsedAssets(assets)
    setValidationResult(result)
    setIsValidating(false)
    return result
  }, [])

  // Initialize with parsed data
  const initializeValidation = useCallback((
    data: string[][],
    headersParam: string[],
    mappings: AssetColumnMappings
  ): ValidationResult => {
    const assets = parseAssetsFromData(data, headersParam, mappings)
    setOriginalAssets(assets)
    setParsedAssets(assets)
    setModifiedRows(new Set())
    setDeletedRows(new Set())
    
    const result = revalidate(assets)
    return result
  }, [revalidate])

  // Remove parent_id from a single row (make it a root asset)
  const removeParentId = useCallback((row: number) => {
    setParsedAssets(prev => {
      const updated = prev.map(asset => 
        asset.row === row 
          ? { 
              ...asset, 
              parentId: null,
              originalRowData: updateRowData(asset.originalRowData, headers, 'parent_id', '')
            }
          : asset
      )
      revalidate(updated)
      return updated
    })
    setModifiedRows(prev => new Set([...prev, row]))
  }, [headers, revalidate])

  // Change parent_id to a new valid parent
  const changeParentId = useCallback((row: number, newParentId: string) => {
    setParsedAssets(prev => {
      const updated = prev.map(asset => 
        asset.row === row 
          ? { 
              ...asset, 
              parentId: newParentId,
              originalRowData: updateRowData(asset.originalRowData, headers, 'parent_id', newParentId)
            }
          : asset
      )
      revalidate(updated)
      return updated
    })
    setModifiedRows(prev => new Set([...prev, row]))
  }, [headers, revalidate])

  // Get valid parent options (excluding the current asset to prevent self-reference)
  const getValidParentOptions = useCallback((excludeRow: number): ParentOption[] => {
    return parsedAssets
      .filter(a => a.row !== excludeRow && a.id) // Exclude self and assets without ID
      .map(a => ({ id: a.id, name: a.name, row: a.row }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [parsedAssets])

  // Bulk remove parent_ids for a specific orphan group
  const bulkRemoveOrphanParents = useCallback((orphanGroup: OrphanGroup) => {
    const rowsToFix = orphanGroup.orphans.map(o => o.row)
    
    setParsedAssets(prev => {
      const updated = prev.map(asset => 
        rowsToFix.includes(asset.row)
          ? { 
              ...asset, 
              parentId: null,
              originalRowData: updateRowData(asset.originalRowData, headers, 'parent_id', '')
            }
          : asset
      )
      revalidate(updated)
      return updated
    })
    setModifiedRows(prev => new Set([...prev, ...rowsToFix]))
  }, [headers, revalidate])

  // Bulk remove ALL orphan parent_ids
  const bulkRemoveAllOrphanParents = useCallback(() => {
    if (!validationResult) return
    
    const allOrphanRows = validationResult.orphanGroups.flatMap(g => 
      g.orphans.map(o => o.row)
    )
    
    setParsedAssets(prev => {
      const updated = prev.map(asset => 
        allOrphanRows.includes(asset.row)
          ? { 
              ...asset, 
              parentId: null,
              originalRowData: updateRowData(asset.originalRowData, headers, 'parent_id', '')
            }
          : asset
      )
      revalidate(updated)
      return updated
    })
    setModifiedRows(prev => new Set([...prev, ...allOrphanRows]))
  }, [validationResult, headers, revalidate])

  // Break a cycle by removing parent_id from a specific row
  const breakCycleAtRow = useCallback((row: number) => {
    setParsedAssets(prev => {
      const updated = prev.map(asset => 
        asset.row === row
          ? { 
              ...asset, 
              parentId: null,
              originalRowData: updateRowData(asset.originalRowData, headers, 'parent_id', '')
            }
          : asset
      )
      revalidate(updated)
      return updated
    })
    setModifiedRows(prev => new Set([...prev, row]))
  }, [headers, revalidate])

  // Break all cycles (pick first asset in each cycle)
  const breakAllCycles = useCallback(() => {
    if (!validationResult) return
    
    // For each cycle, pick the first row to break
    const rowsToBreak = validationResult.cycles.map(cycle => cycle.rows[0])
    
    setParsedAssets(prev => {
      const updated = prev.map(asset => 
        rowsToBreak.includes(asset.row)
          ? { 
              ...asset, 
              parentId: null,
              originalRowData: updateRowData(asset.originalRowData, headers, 'parent_id', '')
            }
          : asset
      )
      revalidate(updated)
      return updated
    })
    setModifiedRows(prev => new Set([...prev, ...rowsToBreak]))
  }, [validationResult, headers, revalidate])

  // ============================================================================
  // Duplicate Fix Functions
  // ============================================================================

  // Get all children of a specific asset ID (optionally excluding certain rows)
  const getChildrenOfAsset = useCallback((assetId: string, excludeRows: number[] = []): ChildAssetInfo[] => {
    return parsedAssets
      .filter(a => 
        a.parentId === assetId && 
        !excludeRows.includes(a.row) &&
        !deletedRows.has(a.row)
      )
      .map(a => ({
        row: a.row,
        id: a.id,
        name: a.name,
        parentId: a.parentId || ''
      }))
  }, [parsedAssets, deletedRows])

  // Change the ID of an asset
  const changeAssetId = useCallback((row: number, newId: string) => {
    setParsedAssets(prev => {
      const updated = prev.map(asset => 
        asset.row === row 
          ? { 
              ...asset, 
              id: newId,
              originalRowData: updateRowData(asset.originalRowData, headers, 'id', newId)
            }
          : asset
      )
      revalidate(updated.filter(a => !deletedRows.has(a.row)))
      return updated
    })
    setModifiedRows(prev => new Set([...prev, row]))
  }, [headers, revalidate, deletedRows])

  // Delete a row (mark as deleted)
  const deleteRow = useCallback((row: number) => {
    setDeletedRows(prev => new Set([...prev, row]))
    // Revalidate without deleted rows
    const remainingAssets = parsedAssets.filter(a => !deletedRows.has(a.row) && a.row !== row)
    revalidate(remainingAssets)
  }, [parsedAssets, deletedRows, revalidate])

  // Undelete a row
  const undeleteRow = useCallback((row: number) => {
    setDeletedRows(prev => {
      const next = new Set(prev)
      next.delete(row)
      return next
    })
    // Revalidate with restored row
    const remainingAssets = parsedAssets.filter(a => !deletedRows.has(a.row) || a.row === row)
    revalidate(remainingAssets)
  }, [parsedAssets, deletedRows, revalidate])

  // Reassign children to a new parent (or make them root assets)
  const reassignChildrenToParent = useCallback((childRows: number[], newParentId: string | null) => {
    setParsedAssets(prev => {
      const updated = prev.map(asset => 
        childRows.includes(asset.row)
          ? { 
              ...asset, 
              parentId: newParentId,
              originalRowData: updateRowData(asset.originalRowData, headers, 'parent_id', newParentId || '')
            }
          : asset
      )
      revalidate(updated.filter(a => !deletedRows.has(a.row)))
      return updated
    })
    setModifiedRows(prev => new Set([...prev, ...childRows]))
  }, [headers, revalidate, deletedRows])

  // Reset all changes
  const resetToOriginal = useCallback(() => {
    setParsedAssets(originalAssets)
    setModifiedRows(new Set())
    setDeletedRows(new Set())
    revalidate(originalAssets)
  }, [originalAssets, revalidate])

  // Generate CSV from current (modified) assets, excluding deleted rows
  const getModifiedCSV = useCallback(() => {
    const activeAssets = parsedAssets.filter(a => !deletedRows.has(a.row))
    return generateCSVFromAssets(activeAssets, headers)
  }, [parsedAssets, headers, deletedRows])

  // Clear all state
  const clearState = useCallback(() => {
    setOriginalAssets([])
    setParsedAssets([])
    setModifiedRows(new Set())
    setDeletedRows(new Set())
    setValidationResult(null)
    setIsValidating(false)
  }, [])

  return {
    parsedAssets,
    validationResult,
    modifiedRows,
    deletedRows,
    isValidating,
    hasChanges,
    initializeValidation,
    removeParentId,
    changeParentId,
    bulkRemoveOrphanParents,
    bulkRemoveAllOrphanParents,
    getValidParentOptions,
    breakCycleAtRow,
    breakAllCycles,
    getChildrenOfAsset,
    changeAssetId,
    deleteRow,
    undeleteRow,
    reassignChildrenToParent,
    resetToOriginal,
    getModifiedCSV,
    clearState,
  }
}

// Helper function to update a specific field in the original row data
function updateRowData(
  rowData: string[],
  headers: string[],
  fieldName: string,
  newValue: string
): string[] {
  // Define aliases for common field names
  const fieldAliases: Record<string, string[]> = {
    parent_id: ['parent_id', 'parent id', 'parentid', 'parent'],
    id: ['id', 'asset_id', 'assetid', 'asset id', 'identifier'],
    name: ['name', 'asset_name', 'assetname', 'asset name', 'title'],
  }

  // Get aliases for the field (or use the field name directly)
  const aliases = fieldAliases[fieldName.toLowerCase()] || [fieldName.toLowerCase()]
  
  // Find the column index
  const fieldIndex = headers.findIndex(h => 
    aliases.includes(h.toLowerCase())
  )
  
  if (fieldIndex >= 0 && fieldIndex < rowData.length) {
    const updated = [...rowData]
    updated[fieldIndex] = newValue
    return updated
  }
  
  return rowData
}

