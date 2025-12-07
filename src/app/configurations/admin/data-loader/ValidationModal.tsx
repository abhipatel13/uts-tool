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
import { ValidationResult, OrphanGroup, OrphanInfo, DuplicateInfo, ParsedAsset } from '@/types/validation'
import { ParentOption, ChildAssetInfo } from './hooks/useAssetValidation'
import { OrphanFixDialog } from './OrphanFixDialog'
import { DuplicateFixDialog } from './DuplicateFixDialog'
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
  const [pendingGroupFix, setPendingGroupFix] = useState<OrphanGroup | null>(null)
  const [showFixGroupConfirm, setShowFixGroupConfirm] = useState(false)

  // Open the orphan fix dialog for a specific orphan
  const handleOrphanFixClick = useCallback((orphan: OrphanInfo) => {
    setSelectedOrphan(orphan)
    setOrphanFixDialogOpen(true)
  }, [])

  // Get parent options for the selected orphan
  const parentOptionsForOrphan = useMemo(() => {
    if (!selectedOrphan) return []
    return getValidParentOptions(selectedOrphan.row)
  }, [selectedOrphan, getValidParentOptions])

  // Confirmation handlers
  const handleFixAllOrphansClick = useCallback(() => {
    setShowFixAllOrphansConfirm(true)
  }, [])

  const handleFixGroupClick = useCallback((group: OrphanGroup) => {
    setPendingGroupFix(group)
    setShowFixGroupConfirm(true)
  }, [])

  const handleBreakAllCyclesClick = useCallback(() => {
    setShowBreakAllCyclesConfirm(true)
  }, [])

  // Open the duplicate fix dialog for a specific duplicate
  const handleDuplicateFixClick = useCallback((dup: DuplicateInfo) => {
    setSelectedDuplicate(dup)
    setDuplicateFixDialogOpen(true)
  }, [])

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!validationResult) return null
    
    const cycleCount = validationResult.cycles.length
    const orphanCount = validationResult.orphanGroups.reduce(
      (sum, g) => sum + g.orphans.length, 0
    )
    const duplicateCount = validationResult.duplicates.reduce(
      (sum, d) => sum + d.rows.length, 0
    )
    const missingNameCount = validationResult.missingNames.length
    
    return {
      cycleCount,
      orphanCount,
      duplicateCount,
      missingNameCount,
      totalIssues: cycleCount + orphanCount + duplicateCount + missingNameCount,
    }
  }, [validationResult])

  // Count unfixed orphans (those not in modifiedRows)
  const unfixedOrphanCount = useMemo(() => {
    if (!validationResult) return 0
    return validationResult.orphanGroups.reduce((sum, g) => {
      const unfixed = g.orphans.filter(o => !modifiedRows.has(o.row))
      return sum + unfixed.length
    }, 0)
  }, [validationResult, modifiedRows])

  // Count unfixed cycles
  const unfixedCycleCount = useMemo(() => {
    if (!validationResult) return 0
    return validationResult.cycles.filter(c => 
      !c.rows.some(row => modifiedRows.has(row))
    ).length
  }, [validationResult, modifiedRows])

  // Count unfixed duplicates (duplicates where not all but one have been modified/deleted)
  const unfixedDuplicateCount = useMemo(() => {
    if (!validationResult) return 0
    return validationResult.duplicates.filter(dup => {
      // A duplicate is "fixed" if all but one row has been either modified or deleted
      const fixedRows = dup.rows.filter(row => modifiedRows.has(row) || deletedRows.has(row))
      return fixedRows.length < dup.rows.length - 1 // Need to fix all but one
    }).length
  }, [validationResult, modifiedRows, deletedRows])

  // Count unfixed missing names
  const unfixedMissingNameCount = useMemo(() => {
    if (!validationResult) return 0
    return validationResult.missingNames.filter(m => 
      !modifiedRows.has(m.row) && !deletedRows.has(m.row)
    ).length
  }, [validationResult, modifiedRows, deletedRows])

  const canProceed = validationResult && !validationResult.hasErrors

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
              <div className={`rounded-lg p-4 ${
                validationResult.hasErrors 
                  ? 'bg-amber-50 border border-amber-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-3">
                  {validationResult.hasErrors ? (
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      validationResult.hasErrors ? 'text-amber-800' : 'text-green-800'
                    }`}>
                      {validationResult.hasErrors 
                        ? `${summary?.totalIssues} Issue${summary?.totalIssues !== 1 ? 's' : ''} Found`
                        : 'All Validations Passed!'
                      }
                    </h3>
                    <p className={`text-sm ${
                      validationResult.hasErrors ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {validationResult.totalAssets.toLocaleString()} assets validated
                      {validationResult.hasErrors && (
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
                  {/* Cycles Section */}
                  {validationResult.cycles.length > 0 && (
                    <AccordionItem value="cycles" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <RefreshCw className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">Circular Dependencies</span>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {validationResult.cycles.length}
                          </Badge>
                          {unfixedCycleCount < validationResult.cycles.length && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {validationResult.cycles.length - unfixedCycleCount} fixed
                            </Badge>
                          )}
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
                            const isFixed = cycle.rows.some(row => modifiedRows.has(row))
                            
                            return (
                              <div 
                                key={cycle.cycleId}
                                className={`rounded-lg p-3 border ${
                                  isFixed 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-purple-50 border-purple-100'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
                                    {isFixed ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <RefreshCw className="w-4 h-4" />
                                    )}
                                    Cycle {cycle.cycleId.replace('cycle-', '#')}
                                    {isFixed && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                        Fixed
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 text-sm mb-3">
                                  {cycle.assetIds.map((id, idx) => (
                                    <span key={id} className="flex items-center">
                                      <span className={`px-2 py-0.5 rounded border ${
                                        modifiedRows.has(cycle.rows[idx])
                                          ? 'bg-green-100 border-green-300'
                                          : 'bg-white border-purple-200'
                                      }`}>
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
                                {!isFixed && (
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
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Orphans Section */}
                  {validationResult.orphanGroups.length > 0 && (
                    <AccordionItem value="orphans" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <Ghost className="w-5 h-5 text-red-600" />
                          <span className="font-medium">Orphaned Assets</span>
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {summary?.orphanCount}
                          </Badge>
                          {unfixedOrphanCount < (summary?.orphanCount || 0) && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {(summary?.orphanCount || 0) - unfixedOrphanCount} fixed
                            </Badge>
                          )}
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
                            const unfixedInGroup = group.orphans.filter(o => !modifiedRows.has(o.row))
                            const allFixed = unfixedInGroup.length === 0
                            
                            return (
                              <div 
                                key={group.missingParentId}
                                className={`rounded-lg p-3 border ${
                                  allFixed 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-red-50 border-red-100'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                                    {allFixed ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4" />
                                    )}
                                    Parent &quot;{group.missingParentId}&quot; not found
                                    <Badge variant="outline" className={
                                      allFixed 
                                        ? "text-green-600 border-green-300"
                                        : "text-red-600 border-red-300"
                                    }>
                                      {group.orphans.length} asset{group.orphans.length !== 1 ? 's' : ''}
                                    </Badge>
                                    {allFixed && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                        All Fixed
                                      </Badge>
                                    )}
                                  </div>
                                  {!allFixed && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleFixGroupClick(group)}
                                      className="text-xs"
                                    >
                                      Fix Group ({unfixedInGroup.length})
                                    </Button>
                                  )}
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {group.orphans.map((orphan) => {
                                    const isFixed = modifiedRows.has(orphan.row)
                                    
                                    return (
                                      <div 
                                        key={orphan.row}
                                        className={`text-sm flex items-center justify-between py-1 px-2 rounded ${
                                          isFixed ? 'bg-green-100' : ''
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          {isFixed && (
                                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                                          )}
                                          <span className="text-red-500 text-xs w-16">Row {orphan.row}</span>
                                          <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">
                                            {orphan.assetId}
                                          </span>
                                          <span className="text-gray-600">{orphan.assetName}</span>
                                        </div>
                                        {!isFixed && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleOrphanFixClick(orphan)}
                                            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
                                          >
                                            Fix
                                          </Button>
                                        )}
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

                  {/* Duplicates Section */}
                  {validationResult.duplicates.length > 0 && (
                    <AccordionItem value="duplicates" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <Copy className="w-5 h-5 text-orange-600" />
                          <span className="font-medium">Duplicate IDs</span>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {validationResult.duplicates.length} ID{validationResult.duplicates.length !== 1 ? 's' : ''}
                          </Badge>
                          {unfixedDuplicateCount < validationResult.duplicates.length && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {validationResult.duplicates.length - unfixedDuplicateCount} fixed
                            </Badge>
                          )}
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
                            // Check if this duplicate is fixed
                            const fixedRows = dup.rows.filter(row => modifiedRows.has(row) || deletedRows.has(row))
                            const isFixed = fixedRows.length >= dup.rows.length - 1
                            
                            return (
                              <div 
                                key={dup.id}
                                className={`rounded-lg p-3 border ${
                                  isFixed 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-orange-50 border-orange-100'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                                    {isFixed ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                    ID &quot;{dup.id}&quot;
                                    <Badge variant="outline" className={
                                      isFixed 
                                        ? "text-green-600 border-green-300"
                                        : "text-orange-600 border-orange-300"
                                    }>
                                      {dup.rows.length} occurrences
                                    </Badge>
                                    {isFixed && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                        Fixed
                                      </Badge>
                                    )}
                                  </div>
                                  {!isFixed && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDuplicateFixClick(dup)}
                                      className="text-xs"
                                    >
                                      Fix
                                    </Button>
                                  )}
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {dup.rows.map((row, idx) => {
                                    const rowModified = modifiedRows.has(row)
                                    const rowDeleted = deletedRows.has(row)
                                    
                                    return (
                                      <div 
                                        key={row}
                                        className={`text-sm flex items-center justify-between py-1 px-2 rounded ${
                                          rowDeleted 
                                            ? 'bg-red-100 line-through opacity-60'
                                            : rowModified 
                                              ? 'bg-green-100'
                                              : ''
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          {rowDeleted && (
                                            <Badge variant="secondary" className="bg-red-200 text-red-700 text-xs">
                                              Deleted
                                            </Badge>
                                          )}
                                          {rowModified && !rowDeleted && (
                                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                                          )}
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

                  {/* Missing Names Section */}
                  {validationResult.missingNames.length > 0 && (
                    <AccordionItem value="missing-names" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <FileX className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Missing Names</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {validationResult.missingNames.length}
                          </Badge>
                          {unfixedMissingNameCount < validationResult.missingNames.length && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {validationResult.missingNames.length - unfixedMissingNameCount} fixed
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">
                            All assets must have a name. Edit the file to add names or delete these rows.
                          </p>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {validationResult.missingNames.map((missing) => {
                            const isFixed = modifiedRows.has(missing.row) || deletedRows.has(missing.row)
                            const isDeleted = deletedRows.has(missing.row)
                            
                            return (
                              <div 
                                key={missing.row}
                                className={`rounded-lg p-2 border ${
                                  isDeleted 
                                    ? 'bg-red-50 border-red-200 line-through opacity-60' 
                                    : isFixed 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-blue-50 border-blue-100'
                                }`}
                              >
                                <div className="flex items-center gap-2 text-sm">
                                  {isDeleted ? (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                  ) : isFixed ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <FileX className="w-4 h-4 text-blue-600" />
                                  )}
                                  <span className="text-blue-500 text-xs w-16">Row {missing.row}</span>
                                  <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">
                                    {missing.assetId}
                                  </span>
                                  {missing.parentId && (
                                    <span className="text-xs text-gray-500">
                                      parent: {missing.parentId}
                                    </span>
                                  )}
                                  {isFixed && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs ml-auto">
                                      {isDeleted ? 'Deleted' : 'Fixed'}
                                    </Badge>
                                  )}
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

                  {/* Success State Details */}
                  {!validationResult.hasErrors && (
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-700 mb-2">Validation Summary</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {validationResult.totalAssets.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Total Assets</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">0</div>
                          <div className="text-xs text-gray-500">Errors</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">✓</div>
                          <div className="text-xs text-gray-500">Ready to Upload</div>
                        </div>
                      </div>
                      {hasChanges && (
                        <div className="mt-3 pt-3 border-t text-center text-sm text-blue-600">
                          {modifiedRows.size} modification{modifiedRows.size !== 1 ? 's' : ''} will be applied
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
              {validationResult.hasErrors && (
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

      {/* Orphan Fix Dialog */}
      <OrphanFixDialog
        open={orphanFixDialogOpen}
        onOpenChange={setOrphanFixDialogOpen}
        orphan={selectedOrphan}
        validParentOptions={parentOptionsForOrphan}
        onRemoveParent={onRemoveParentId}
        onChangeParent={onChangeParentId}
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
              To assign new parents individually, use the &quot;Fix&quot; button on each row instead.
            </p>
          </div>
        }
        confirmLabel="Remove All Parents"
        variant="warning"
        onConfirm={onBulkRemoveAllOrphanParents}
      />

      {/* Fix Group Confirmation */}
      <ConfirmationDialog
        open={showFixGroupConfirm}
        onOpenChange={setShowFixGroupConfirm}
        title="Fix Orphan Group"
        description={
          <div className="space-y-2">
            <p>
              This will <strong>remove the parent reference</strong> from all assets looking for parent &quot;{pendingGroupFix?.missingParentId}&quot;.
            </p>
            <p>Each affected asset will become a root-level asset with no parent.</p>
          </div>
        }
        confirmLabel="Remove Parents"
        variant="warning"
        onConfirm={() => pendingGroupFix && onBulkRemoveOrphanParents(pendingGroupFix)}
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
        getChildrenOfAsset={getChildrenOfAsset}
        getValidParentOptions={getValidParentOptions}
        onChangeAssetId={onChangeAssetId}
        onDeleteRow={onDeleteRow}
        onReassignChildren={onReassignChildren}
      />
    </Dialog>
  )
}
