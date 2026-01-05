"use client"

import { useState, useMemo, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ValidationResult, OrphanGroup, OrphanInfo, DuplicateInfo, MissingNameInfo, ParsedAsset } from '@/types/validation'
import { ParentOption, ChildAssetInfo } from './hooks/useAssetValidation'
import { OrphanFixDialog } from './OrphanFixDialog'
import { DuplicateFixDialog } from './DuplicateFixDialog'
import { MissingNameFixDialog } from './MissingNameFixDialog'
import { ConfirmationDialog } from './ConfirmationDialog'
import { AssetTableView } from './AssetTableView'
import { 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  Ghost,
  ChevronRight,
  FileWarning,
  Undo2,
  Wrench,
  List,
  Table2,
  FileX
} from 'lucide-react'

interface ValidationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  validationResult: ValidationResult | null
  parsedAssets: ParsedAsset[]
  isValidating: boolean
  fileName: string
  modifiedRows: Set<number>
  deletedRows: Set<number>
  hasChanges: boolean
  onCancel: () => void
  onProceed: () => void
  // Fix actions - Orphans
  onRemoveParentId: (row: number) => void
  onChangeParentId: (row: number, newParentId: string) => void
  onBulkRemoveOrphanParents: (orphanGroup: OrphanGroup) => void
  onBulkRemoveAllOrphanParents: () => void
  // Fix actions - Cycles
  onBreakCycleAtRow: (row: number) => void
  onBreakAllCycles: () => void
  // Fix actions - Duplicates
  onChangeAssetId: (row: number, newId: string) => void
  onDeleteRow: (row: number) => void
  onReassignChildren: (childRows: number[], newParentId: string | null) => void
  getChildrenOfAsset: (assetId: string, excludeRows?: number[]) => ChildAssetInfo[]
  // Fix actions - Missing Names
  onUpdateAssetName: (row: number, newName: string) => void
  // Utilities
  onResetChanges: () => void
  getValidParentOptions: (excludeRow: number) => ParentOption[]
}

export function ValidationModal({
  open,
  onOpenChange,
  validationResult,
  parsedAssets,
  isValidating,
  fileName,
  modifiedRows,
  deletedRows,
  hasChanges,
  onCancel,
  onProceed,
  onRemoveParentId,
  onChangeParentId,
  onBulkRemoveOrphanParents,
  onBulkRemoveAllOrphanParents,
  onBreakCycleAtRow,
  onBreakAllCycles,
  onChangeAssetId,
  onDeleteRow,
  onReassignChildren,
  getChildrenOfAsset,
  onUpdateAssetName,
  onResetChanges,
  getValidParentOptions,
}: ValidationModalProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'summary' | 'table'>('summary')
  
  // Orphan fix dialog state
  const [orphanFixDialogOpen, setOrphanFixDialogOpen] = useState(false)
  const [selectedOrphan, setSelectedOrphan] = useState<OrphanInfo | null>(null)
  
  // Duplicate fix dialog state
  const [duplicateFixDialogOpen, setDuplicateFixDialogOpen] = useState(false)
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateInfo | null>(null)
  
  // Confirmation dialog states
  const [showFixAllOrphansConfirm, setShowFixAllOrphansConfirm] = useState(false)
  const [showBreakAllCyclesConfirm, setShowBreakAllCyclesConfirm] = useState(false)
  
  // Orphan group fix dialog state (uses OrphanFixDialog in group mode)
  const [orphanGroupFixDialogOpen, setOrphanGroupFixDialogOpen] = useState(false)
  const [selectedOrphanGroup, setSelectedOrphanGroup] = useState<OrphanGroup | null>(null)

  // Missing name fix dialog state
  const [missingNameFixDialogOpen, setMissingNameFixDialogOpen] = useState(false)
  const [selectedMissingName, setSelectedMissingName] = useState<MissingNameInfo | null>(null)

  // Open the orphan fix dialog for a specific orphan
  const handleOrphanFixClick = useCallback((orphan: OrphanInfo) => {
    setSelectedOrphan(orphan)
    setOrphanFixDialogOpen(true)
  }, [])

  // Get parent options for the selected orphan (single mode)
  const parentOptionsForOrphan = useMemo(() => {
    if (!selectedOrphan) return []
    return getValidParentOptions(selectedOrphan.row)
  }, [selectedOrphan, getValidParentOptions])

  // Get parent options for the selected orphan group
  // Excludes all orphans in the group to prevent selecting any of them as parent
  const parentOptionsForOrphanGroup = useMemo(() => {
    if (!selectedOrphanGroup) return []
    // Use the first orphan's row, but exclude all orphan rows from valid options
    const firstOrphanRow = selectedOrphanGroup.orphans[0]?.row ?? 0
    const allOptions = getValidParentOptions(firstOrphanRow)
    // Filter out any options that are part of this orphan group
    const orphanRows = new Set(selectedOrphanGroup.orphans.map(o => o.row))
    return allOptions.filter(opt => !orphanRows.has(opt.row))
  }, [selectedOrphanGroup, getValidParentOptions])

  // Confirmation handlers
  const handleFixAllOrphansClick = useCallback(() => {
    setShowFixAllOrphansConfirm(true)
  }, [])

  const handleFixGroupClick = useCallback((group: OrphanGroup) => {
    setSelectedOrphanGroup(group)
    setOrphanGroupFixDialogOpen(true)
  }, [])

  const handleBreakAllCyclesClick = useCallback(() => {
    setShowBreakAllCyclesConfirm(true)
  }, [])

  // Open the duplicate fix dialog for a specific duplicate
  const handleDuplicateFixClick = useCallback((dup: DuplicateInfo) => {
    setSelectedDuplicate(dup)
    setDuplicateFixDialogOpen(true)
  }, [])

  // Open the missing name fix dialog for a specific asset
  const handleMissingNameFixClick = useCallback((missing: MissingNameInfo) => {
    setSelectedMissingName(missing)
    setMissingNameFixDialogOpen(true)
  }, [])


  // Count unfixed orphans
  // An orphan is only "fixed" if deleted OR its parent reference was changed
  const unfixedOrphanCount = useMemo(() => {
    if (!validationResult) return 0
    return validationResult.orphanGroups.reduce((sum, g) => {
      const unfixed = g.orphans.filter(o => {
        if (deletedRows.has(o.row)) return false // deleted = fixed
        // Check if parent was changed from the missing value (case-sensitive - must match exactly)
        const asset = parsedAssets.find(a => a.row === o.row)
        if (!asset) return true // can't find asset, still unfixed
        return asset.parentId === o.missingParentId // still has the bad parent = unfixed
      })
      return sum + unfixed.length
    }, 0)
  }, [validationResult, parsedAssets, deletedRows])

  // Count unfixed cycles
  // A cycle is "fixed" if any row was deleted OR had its parent removed/changed
  const unfixedCycleCount = useMemo(() => {
    if (!validationResult) return 0
    return validationResult.cycles.filter(c => {
      // Check if any row in the cycle has been fixed (deleted or parent removed)
      const hasFixedRow = c.rows.some(row => {
        if (deletedRows.has(row)) return true
        // Check if parent was removed (empty = cycle broken)
        const asset = parsedAssets.find(a => a.row === row)
        return asset && (!asset.parentId || asset.parentId.trim() === '')
      })
      return !hasFixedRow
    }).length
  }, [validationResult, parsedAssets, deletedRows])

  // Count unfixed duplicates
  // A duplicate row is only "fixed" if deleted OR its ID was actually changed
  const unfixedDuplicateCount = useMemo(() => {
    if (!validationResult) return 0
    return validationResult.duplicates.filter(dup => {
      // A row is "fixed" for this duplicate if: deleted OR its current ID no longer matches the duplicate ID
      const fixedRows = dup.rows.filter(row => {
        if (deletedRows.has(row)) return true
        // Check if the row's current ID is different from the duplicate ID (case-insensitive)
        const asset = parsedAssets.find(a => a.row === row)
        return asset && asset.id.toLowerCase() !== dup.id.toLowerCase()
      })
      return fixedRows.length < dup.rows.length - 1 // Need to fix all but one
    }).length
  }, [validationResult, parsedAssets, deletedRows])

  // Count unfixed missing names
  // A missing name is only "fixed" if deleted OR name was actually added
  const unfixedMissingNameCount = useMemo(() => {
    if (!validationResult) return 0
    return validationResult.missingNames.filter(m => {
      if (deletedRows.has(m.row)) return false // deleted = fixed
      // Check if name was added
      const asset = parsedAssets.find(a => a.row === m.row)
      if (!asset) return true // can't find asset, still unfixed
      return !asset.name || asset.name.trim() === '' // still no name = unfixed
    }).length
  }, [validationResult, parsedAssets, deletedRows])

  // Check if there are any UNFIXED issues (not just if validation found issues)
  // This allows proceeding once all issues have been fixed
  const hasUnfixedErrors = unfixedCycleCount > 0 || 
    unfixedOrphanCount > 0 || 
    unfixedDuplicateCount > 0 || 
    unfixedMissingNameCount > 0
  
  const canProceed = validationResult && !hasUnfixedErrors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#2C3E50] flex items-center gap-2">
            <FileWarning className="w-5 h-5" />
            Validation Results
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Loading State */}
          {isValidating && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
              <p className="text-gray-600">Validating assets...</p>
              <p className="text-sm text-gray-500">{fileName}</p>
            </div>
          )}

          {/* Results */}
          {!isValidating && validationResult && (
            <>
              {/* Summary Card */}
              {(() => {
                const totalUnfixed = unfixedCycleCount + unfixedOrphanCount + unfixedDuplicateCount + unfixedMissingNameCount
                const allFixed = validationResult.hasErrors && totalUnfixed === 0
                const showSuccess = !validationResult.hasErrors || allFixed
                
                return (
                  <div className={`rounded-lg p-4 ${
                    showSuccess 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-amber-50 border border-amber-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {showSuccess ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                      )}
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          showSuccess ? 'text-green-800' : 'text-amber-800'
                        }`}>
                          {showSuccess
                            ? allFixed 
                              ? 'All Issues Fixed!' 
                              : 'All Validations Passed!'
                            : `${totalUnfixed} Issue${totalUnfixed !== 1 ? 's' : ''} Found`
                          }
                        </h3>
                        <p className={`text-sm ${
                          showSuccess ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          {validationResult.totalAssets.toLocaleString()} assets validated
                          {!showSuccess && (
                            <> • {validationResult.validAssets.toLocaleString()} valid</>
                          )}
                        </p>
                      </div>
                      {hasChanges && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={onResetChanges}
                          className="text-gray-600"
                        >
                          <Undo2 className="w-4 h-4 mr-1" />
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Modified rows indicator */}
              {hasChanges && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                  <Wrench className="w-4 h-4" />
                  <span>{modifiedRows.size} row{modifiedRows.size !== 1 ? 's' : ''} modified</span>
                  {deletedRows.size > 0 && (
                    <span className="text-red-600">• {deletedRows.size} deleted</span>
                  )}
                </div>
              )}

              {/* View Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'summary' | 'table')}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="summary" className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Summary View
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <Table2 className="w-4 h-4" />
                    Table View
                  </TabsTrigger>
                </TabsList>

                {/* Summary View */}
                <TabsContent value="summary" className="mt-4 space-y-4">
                  {/* Error Sections */}
                  {validationResult.hasErrors && (
                    <Accordion 
                      type="multiple" 
                      value={expandedSections}
                      onValueChange={setExpandedSections}
                      className="space-y-2"
                    >
                  {/* Cycles Section - only show if there are unfixed cycles */}
                  {unfixedCycleCount > 0 && (
                    <AccordionItem value="cycles" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <RefreshCw className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">Circular Dependencies</span>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {unfixedCycleCount}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-gray-600">
                            Break cycles by removing a parent reference from one asset in each cycle.
                          </p>
                          {unfixedCycleCount > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleBreakAllCyclesClick}
                              className="text-purple-700 border-purple-300 hover:bg-purple-50"
                            >
                              Break All ({unfixedCycleCount})
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {validationResult.cycles.map((cycle) => {
                            // Helper to check if a cycle row is fixed (deleted or parent removed)
                            const isCycleRowFixed = (row: number) => {
                              if (deletedRows.has(row)) return true
                              const asset = parsedAssets.find(a => a.row === row)
                              return asset && (!asset.parentId || asset.parentId.trim() === '')
                            }
                            const isFixed = cycle.rows.some(isCycleRowFixed)
                            
                            // Don't display fixed cycles
                            if (isFixed) return null
                            
                            return (
                              <div 
                                key={cycle.cycleId}
                                className="rounded-lg p-3 border bg-purple-50 border-purple-100"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
                                    <RefreshCw className="w-4 h-4" />
                                    Cycle {cycle.cycleId.replace('cycle-', '#')}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 text-sm mb-3">
                                  {cycle.assetIds.map((id, idx) => (
                                    <span key={id} className="flex items-center">
                                      <span className="px-2 py-0.5 rounded border bg-white border-purple-200">
                                        {id}
                                        <span className="text-purple-500 text-xs ml-1">
                                          (Row {cycle.rows[idx]})
                                        </span>
                                      </span>
                                      {idx < cycle.assetIds.length - 1 && (
                                        <ChevronRight className="w-4 h-4 text-purple-400 mx-1" />
                                      )}
                                    </span>
                                  ))}
                                  <ChevronRight className="w-4 h-4 text-purple-400 mx-1" />
                                  <span className="text-purple-600 font-medium">
                                    {cycle.assetIds[0]}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-xs text-gray-500 self-center">Break at:</span>
                                  {cycle.rows.map((row, idx) => (
                                    <Button
                                      key={row}
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onBreakCycleAtRow(row)}
                                      className="text-xs h-7"
                                    >
                                      Row {row} ({cycle.assetNames[idx]})
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Orphans Section - only show if there are unfixed orphans */}
                  {unfixedOrphanCount > 0 && (
                    <AccordionItem value="orphans" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <Ghost className="w-5 h-5 text-red-600" />
                          <span className="font-medium">Orphaned Assets</span>
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {unfixedOrphanCount}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-gray-600">
                            Fix orphans by removing parent references or assigning new parents.
                          </p>
                          {unfixedOrphanCount > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleFixAllOrphansClick}
                              className="text-red-700 border-red-300 hover:bg-red-50"
                            >
                              Fix All ({unfixedOrphanCount})
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {validationResult.orphanGroups.map((group) => {
                            // An orphan is "fixed" if deleted OR parent was changed
                            const isOrphanFixed = (o: typeof group.orphans[0]) => {
                              if (deletedRows.has(o.row)) return true
                              const asset = parsedAssets.find(a => a.row === o.row)
                              return asset ? asset.parentId !== o.missingParentId : false
                            }
                            const unfixedInGroup = group.orphans.filter(o => !isOrphanFixed(o))
                            const allFixed = unfixedInGroup.length === 0
                            
                            // Don't display groups that are fully fixed
                            if (allFixed) return null
                            
                            return (
                              <div 
                                key={group.missingParentId}
                                className="rounded-lg p-3 border bg-red-50 border-red-100"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                                    <AlertCircle className="w-4 h-4" />
                                    Parent &quot;{group.missingParentId}&quot; not found
                                    <Badge variant="outline" className="text-red-600 border-red-300">
                                      {unfixedInGroup.length} asset{unfixedInGroup.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleFixGroupClick(group)}
                                    className="text-xs"
                                  >
                                    Fix Group ({unfixedInGroup.length})
                                  </Button>
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {/* Only show unfixed orphans */}
                                  {unfixedInGroup.map((orphan) => (
                                      <div 
                                        key={orphan.row}
                                        className="text-sm flex items-center justify-between py-1 px-2 rounded"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-red-500 text-xs w-16">Row {orphan.row}</span>
                                          <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">
                                            {orphan.assetId}
                                          </span>
                                          <span className="text-gray-600">{orphan.assetName}</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleOrphanFixClick(orphan)}
                                          className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
                                        >
                                          Fix
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Duplicates Section - only show if there are unfixed duplicates */}
                  {unfixedDuplicateCount > 0 && (
                    <AccordionItem value="duplicates" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <Copy className="w-5 h-5 text-orange-600" />
                          <span className="font-medium">Duplicate IDs</span>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {unfixedDuplicateCount} ID{unfixedDuplicateCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-gray-600">
                            Each ID must be unique. Change IDs or delete duplicate rows.
                          </p>
                        </div>
                        <div className="space-y-3">
                          {validationResult.duplicates.map((dup) => {
                            // A row is "fixed" for this duplicate if: deleted OR its ID was changed
                            const getRowStatus = (row: number) => {
                              if (deletedRows.has(row)) return 'deleted'
                              const asset = parsedAssets.find(a => a.row === row)
                              if (asset && asset.id.toLowerCase() !== dup.id.toLowerCase()) return 'changed'
                              return 'unfixed'
                            }
                            const rowStatuses = dup.rows.map(row => ({ row, status: getRowStatus(row) }))
                            const fixedCount = rowStatuses.filter(r => r.status !== 'unfixed').length
                            const isFullyFixed = fixedCount >= dup.rows.length - 1
                            
                            // Don't display duplicates that are fully fixed
                            if (isFullyFixed) return null
                            
                            // Only show unfixed rows
                            const unfixedRows = rowStatuses.filter(r => r.status === 'unfixed')
                            
                            return (
                              <div 
                                key={dup.id}
                                className="rounded-lg p-3 border bg-orange-50 border-orange-100"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-orange-800 flex-wrap">
                                    <Copy className="w-4 h-4" />
                                    {/* Show unique case variations of the ID */}
                                    {(() => {
                                      const uniqueIds = [...new Set(dup.originalIds)]
                                      return uniqueIds.length === 1 
                                        ? <span>ID &quot;{uniqueIds[0]}&quot;</span>
                                        : <span>IDs &quot;{uniqueIds.join('", "')}&quot;</span>
                                    })()}
                                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                                      {unfixedRows.length + 1} occurrences
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDuplicateFixClick(dup)}
                                    className="text-xs"
                                  >
                                    Fix
                                  </Button>
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {dup.rows.map((row, idx) => {
                                    const rowDeleted = deletedRows.has(row)
                                    // For duplicates, row is only "fixed" if deleted OR ID was changed (case-insensitive)
                                    const asset = parsedAssets.find(a => a.row === row)
                                    const idWasChanged = asset && asset.id.toLowerCase() !== dup.id.toLowerCase()
                                    
                                    // Skip displaying fixed rows (deleted or ID changed)
                                    if (rowDeleted || idWasChanged) return null
                                    
                                    return (
                                      <div 
                                        key={row}
                                        className="text-sm flex items-center justify-between py-1 px-2 rounded"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-orange-500 text-xs w-16">Row {row}</span>
                                          <span className="text-gray-600">{dup.names[idx]}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Missing Names Section - only show if there are unfixed missing names */}
                  {unfixedMissingNameCount > 0 && (
                    <AccordionItem value="missing-names" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <FileX className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Missing Names</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {unfixedMissingNameCount}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">
                            All assets must have a name. Add a name or delete these rows.
                          </p>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {validationResult.missingNames.map((missing) => {
                            const isDeleted = deletedRows.has(missing.row)
                            // Check if name was actually added
                            const asset = parsedAssets.find(a => a.row === missing.row)
                            const nameWasAdded = asset && asset.name && asset.name.trim() !== ''
                            const isFixed = isDeleted || nameWasAdded
                            
                            // Don't display fixed items
                            if (isFixed) return null
                            
                            return (
                              <div 
                                key={missing.row}
                                className="rounded-lg p-2 border bg-blue-50 border-blue-100"
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <FileX className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-500 text-xs w-16">Row {missing.row}</span>
                                    <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">
                                      {missing.assetId}
                                    </span>
                                    {missing.parentId && (
                                      <span className="text-xs text-gray-500">
                                        parent: {missing.parentId}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleMissingNameFixClick(missing)}
                                    className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                  >
                                    Fix
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                    </Accordion>
                  )}

                  {/* Success State Details - show when no errors OR when all issues have been fixed */}
                  {(!validationResult.hasErrors || !hasUnfixedErrors) && (
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-700 mb-2">
                        {validationResult.hasErrors ? 'All Issues Resolved' : 'Validation Summary'}
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {validationResult.totalAssets.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Total Assets</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">0</div>
                          <div className="text-xs text-gray-500">
                            {validationResult.hasErrors ? 'Unfixed Issues' : 'Errors'}
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">✓</div>
                          <div className="text-xs text-gray-500">Ready to Upload</div>
                        </div>
                      </div>
                      {hasChanges && (
                        <div className="mt-3 pt-3 border-t text-center text-sm text-blue-600">
                          {modifiedRows.size} modification{modifiedRows.size !== 1 ? 's' : ''} will be applied
                          {deletedRows.size > 0 && (
                            <span className="text-red-600 ml-2">• {deletedRows.size} row{deletedRows.size !== 1 ? 's' : ''} deleted</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Table View */}
                <TabsContent value="table" className="mt-4">
                  <AssetTableView
                    assets={parsedAssets}
                    validationResult={validationResult}
                    modifiedRows={modifiedRows}
                    deletedRows={deletedRows}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isValidating && validationResult && (
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel Upload
            </Button>
            <div className="flex items-center gap-2">
              {hasUnfixedErrors && (
                <p className="text-sm text-amber-600 mr-2">
                  Fix all issues to enable upload
                </p>
              )}
              <Button
                onClick={onProceed}
                disabled={!canProceed}
                className="bg-[rgb(52_73_94_/_1)] hover:bg-[rgb(42_63_84_/_1)]"
              >
                {canProceed 
                  ? hasChanges 
                    ? 'Upload with Changes' 
                    : 'Proceed with Upload' 
                  : 'Upload Blocked'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Orphan Fix Dialog - Single Mode */}
      <OrphanFixDialog
        open={orphanFixDialogOpen}
        onOpenChange={setOrphanFixDialogOpen}
        orphan={selectedOrphan}
        validParentOptions={parentOptionsForOrphan}
        onRemoveParent={onRemoveParentId}
        onChangeParent={onChangeParentId}
      />

      {/* Orphan Fix Dialog - Group Mode */}
      <OrphanFixDialog
        open={orphanGroupFixDialogOpen}
        onOpenChange={setOrphanGroupFixDialogOpen}
        orphanGroup={selectedOrphanGroup}
        validParentOptions={parentOptionsForOrphanGroup}
        onRemoveParent={onRemoveParentId}
        onChangeParent={onChangeParentId}
        onBulkRemoveOrphanParents={onBulkRemoveOrphanParents}
      />

      {/* Fix All Orphans Confirmation */}
      <ConfirmationDialog
        open={showFixAllOrphansConfirm}
        onOpenChange={setShowFixAllOrphansConfirm}
        title="Fix All Orphaned Assets"
        description={
          <div className="space-y-2">
            <p>
              This will <strong>remove the parent reference</strong> from {unfixedOrphanCount} orphaned asset{unfixedOrphanCount !== 1 ? 's' : ''}.
            </p>
            <p>Each affected asset will become a root-level asset with no parent.</p>
            <p className="text-amber-600 text-xs mt-2">
              To assign new parents individually or in groups, use the &quot;Fix&quot; or &quot;Fix Group&quot; buttons instead.
            </p>
          </div>
        }
        confirmLabel="Remove All Parents"
        variant="warning"
        onConfirm={onBulkRemoveAllOrphanParents}
      />

      {/* Break All Cycles Confirmation */}
      <ConfirmationDialog
        open={showBreakAllCyclesConfirm}
        onOpenChange={setShowBreakAllCyclesConfirm}
        title="Break All Cycles"
        description={
          <div className="space-y-2">
            <p>
              This will <strong>remove the parent reference</strong> from one asset in each cycle to break the circular dependency.
            </p>
            <p>The first asset in each cycle will have its parent reference removed.</p>
          </div>
        }
        confirmLabel="Break All Cycles"
        variant="warning"
        onConfirm={onBreakAllCycles}
      />

      {/* Duplicate Fix Dialog */}
      <DuplicateFixDialog
        open={duplicateFixDialogOpen}
        onOpenChange={setDuplicateFixDialogOpen}
        duplicate={selectedDuplicate}
        parsedAssets={parsedAssets}
        getChildrenOfAsset={getChildrenOfAsset}
        getValidParentOptions={getValidParentOptions}
        onChangeAssetId={onChangeAssetId}
        onDeleteRow={onDeleteRow}
        onReassignChildren={onReassignChildren}
      />

      {/* Missing Name Fix Dialog */}
      <MissingNameFixDialog
        open={missingNameFixDialogOpen}
        onOpenChange={setMissingNameFixDialogOpen}
        missingName={selectedMissingName}
        getChildrenOfAsset={getChildrenOfAsset}
        getValidParentOptions={getValidParentOptions}
        onUpdateName={onUpdateAssetName}
        onDeleteRow={onDeleteRow}
        onReassignChildren={onReassignChildren}
      />
    </Dialog>
  )
}
