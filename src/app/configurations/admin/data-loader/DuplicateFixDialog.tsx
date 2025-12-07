"use client"

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DuplicateInfo } from '@/types/validation'
import { ChildAssetInfo, ParentOption } from './hooks/useAssetValidation'
import { ChildSelectionPanel, ChildAssignments } from './ChildSelectionPanel'
import { 
  Copy, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Check,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Settings2
} from 'lucide-react'

// Action for a single duplicate row
type DuplicateRowAction = 
  | { type: 'keep' }
  | { type: 'change_id'; newId: string }
  | { type: 'delete' }

// Child reassignment mode
type ChildMode = 'simple' | 'advanced'

// Simple child action
type SimpleChildAction = 'keep' | 'make_root'

interface DuplicateFixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicate: DuplicateInfo | null
  getChildrenOfAsset: (assetId: string, excludeRows?: number[]) => ChildAssetInfo[]
  getValidParentOptions: (excludeRow: number) => ParentOption[]
  onChangeAssetId: (row: number, newId: string) => void
  onDeleteRow: (row: number) => void
  onReassignChildren: (childRows: number[], newParentId: string | null) => void
}

interface RowActionState {
  action: DuplicateRowAction
  simpleChildAction: SimpleChildAction
  newIdValue: string
  childMode: ChildMode
  individualChildAssignments: ChildAssignments
}

export function DuplicateFixDialog({
  open,
  onOpenChange,
  duplicate,
  getChildrenOfAsset,
  getValidParentOptions,
  onChangeAssetId,
  onDeleteRow,
  onReassignChildren,
}: DuplicateFixDialogProps) {
  // State for each row's action
  const [rowActions, setRowActions] = useState<Map<number, RowActionState>>(new Map())
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Map<number, string>>(new Map())

  // Initialize row actions when dialog opens with new duplicate
  useEffect(() => {
    if (duplicate && open) {
      const initialActions = new Map<number, RowActionState>()
      duplicate.rows.forEach((row, idx) => {
        initialActions.set(row, {
          action: idx === 0 ? { type: 'keep' } : { type: 'change_id', newId: '' },
          simpleChildAction: 'keep',
          newIdValue: '',
          childMode: 'simple',
          individualChildAssignments: {}
        })
      })
      setRowActions(initialActions)
      setExpandedRows(new Set())
      setValidationErrors(new Map())
    }
  }, [duplicate, open])

  // Get children for the duplicate ID
  const children = useMemo(() => {
    if (!duplicate) return []
    return getChildrenOfAsset(duplicate.id)
  }, [duplicate, getChildrenOfAsset])

  // Update action for a specific row
  const updateRowAction = useCallback((row: number, updates: Partial<RowActionState>) => {
    setRowActions(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(row)
      if (current) {
        newMap.set(row, { ...current, ...updates })
      }
      return newMap
    })
    
    // Clear validation error when user makes changes
    setValidationErrors(prev => {
      const newMap = new Map(prev)
      newMap.delete(row)
      return newMap
    })
  }, [])

  // Set a row as "keep" (and ensure others aren't "keep")
  const setRowAsKeep = useCallback((row: number) => {
    setRowActions(prev => {
      const newMap = new Map(prev)
      for (const [r, state] of newMap.entries()) {
        if (r === row) {
          newMap.set(r, { ...state, action: { type: 'keep' } })
        } else if (state.action.type === 'keep') {
          // Convert previous "keep" to "change_id"
          newMap.set(r, { ...state, action: { type: 'change_id', newId: state.newIdValue } })
        }
      }
      return newMap
    })
  }, [])

  // Toggle row expansion
  const toggleRowExpanded = useCallback((row: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(row)) {
        next.delete(row)
      } else {
        next.add(row)
      }
      return next
    })
  }, [])

  // Validate the fix configuration
  const validate = useCallback((): boolean => {
    const errors = new Map<number, string>()
    let hasKeep = false
    const newIds = new Set<string>()

    for (const [row, state] of rowActions.entries()) {
      if (state.action.type === 'keep') {
        hasKeep = true
      } else if (state.action.type === 'change_id') {
        const newId = state.newIdValue.trim()
        if (!newId) {
          errors.set(row, 'New ID is required')
        } else if (newId === duplicate?.id) {
          errors.set(row, 'New ID must be different from original')
        } else if (newIds.has(newId)) {
          errors.set(row, 'Duplicate new ID')
        } else {
          newIds.add(newId)
        }
      }
    }

    if (!hasKeep && errors.size === 0) {
      // At least one row must be kept or all must be deleted
      const allDeleted = Array.from(rowActions.values()).every(s => s.action.type === 'delete')
      if (!allDeleted) {
        // Find the first non-deleted row and add error
        for (const [row, state] of rowActions.entries()) {
          if (state.action.type !== 'delete') {
            errors.set(row, 'At least one row must be kept with the original ID (or delete all)')
            break
          }
        }
      }
    }

    setValidationErrors(errors)
    return errors.size === 0
  }, [rowActions, duplicate])

  // Apply the fixes
  const handleApply = useCallback(() => {
    if (!validate() || !duplicate) return

    // Process each row action
    const rowsDeleted: number[] = []
    const rowsChanged: { row: number; newId: string }[] = []
    
    for (const [row, state] of rowActions.entries()) {
      if (state.action.type === 'delete') {
        rowsDeleted.push(row)
      } else if (state.action.type === 'change_id') {
        rowsChanged.push({ row, newId: state.newIdValue.trim() })
      }
    }

    // Handle children if any rows are being deleted or changed
    if (children.length > 0 && (rowsDeleted.length > 0 || rowsChanged.length > 0)) {
      // Check if any row uses advanced mode
      const hasAdvancedMode = Array.from(rowActions.values()).some(
        s => (s.action.type === 'delete' || s.action.type === 'change_id') && s.childMode === 'advanced'
      )

      if (hasAdvancedMode) {
        // Process individual child assignments from all rows with advanced mode
        const processedChildren = new Set<number>()
        
        for (const [, state] of rowActions.entries()) {
          if ((state.action.type === 'delete' || state.action.type === 'change_id') && state.childMode === 'advanced') {
            for (const [childRowStr, action] of Object.entries(state.individualChildAssignments)) {
              const childRow = parseInt(childRowStr)
              if (processedChildren.has(childRow)) continue
              processedChildren.add(childRow)

              if (action.type === 'reassign') {
                onReassignChildren([childRow], action.newParentId)
              } else if (action.type === 'make_root') {
                onReassignChildren([childRow], null)
              }
              // 'keep' - no action needed, children will point to kept row
            }
          }
        }

        // Process remaining children not individually assigned
        const unprocessedChildren = children
          .filter(c => !processedChildren.has(c.row))
          .map(c => c.row)
        
        if (unprocessedChildren.length > 0) {
          // Default: keep pointing to original ID (no action needed if keep row exists)
        }
      } else {
        // Simple mode - use bulk actions
        for (const [, state] of rowActions.entries()) {
          if (state.action.type === 'delete' || state.action.type === 'change_id') {
            const childRows = children.map(c => c.row)
            
            if (state.simpleChildAction === 'make_root') {
              onReassignChildren(childRows, null)
            }
            // If 'keep', children remain pointing to original ID (handled by keep row)
            break // Only process once for simple mode
          }
        }
      }
    }

    // Apply deletions
    rowsDeleted.forEach(row => onDeleteRow(row))

    // Apply ID changes
    rowsChanged.forEach(({ row, newId }) => onChangeAssetId(row, newId))

    onOpenChange(false)
  }, [validate, duplicate, rowActions, children, onDeleteRow, onChangeAssetId, onReassignChildren, onOpenChange])

  // Check if we can apply
  const canApply = useMemo(() => {
    if (!duplicate) return false
    
    // Check that all non-keep/non-delete rows have valid new IDs
    for (const [, state] of rowActions.entries()) {
      if (state.action.type === 'change_id' && !state.newIdValue.trim()) {
        return false
      }
    }
    
    // At least one row must be kept OR all must be deleted
    const hasKeep = Array.from(rowActions.values()).some(s => s.action.type === 'keep')
    const allDeleted = Array.from(rowActions.values()).every(s => s.action.type === 'delete')
    
    return hasKeep || allDeleted
  }, [duplicate, rowActions])

  if (!duplicate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-orange-500" />
            Fix Duplicate ID
          </DialogTitle>
          <DialogDescription>
            Multiple assets have the same ID. Choose how to resolve each occurrence.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4">
            {/* Duplicate ID Info */}
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                <AlertCircle className="w-4 h-4" />
                ID &quot;{duplicate.id}&quot; appears in {duplicate.rows.length} rows
              </div>
              {children.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-orange-700 mt-2">
                  <Users className="w-4 h-4" />
                  {children.length} child asset{children.length !== 1 ? 's' : ''} reference this ID as parent
                </div>
              )}
            </div>

            {/* Row Actions */}
            <div className="space-y-3">
              {duplicate.rows.map((row, idx) => {
                const state = rowActions.get(row)
                if (!state) return null
                
                const isExpanded = expandedRows.has(row)
                const error = validationErrors.get(row)
                const rowChildren = children // All children reference the same ID
                
                return (
                  <div 
                    key={row}
                    className={`border rounded-lg overflow-hidden ${
                      state.action.type === 'delete' 
                        ? 'border-red-200 bg-red-50' 
                        : state.action.type === 'keep'
                          ? 'border-green-200 bg-green-50'
                          : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    {/* Row Header */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => toggleRowExpanded(row)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          Row {row}
                        </Badge>
                        <span className="font-medium">{duplicate.names[idx]}</span>
                        {state.action.type === 'keep' && (
                          <Badge className="bg-green-600">Keep</Badge>
                        )}
                        {state.action.type === 'delete' && (
                          <Badge className="bg-red-600">Delete</Badge>
                        )}
                        {state.action.type === 'change_id' && state.newIdValue && (
                          <Badge className="bg-blue-600">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            {state.newIdValue}
                          </Badge>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>

                    {/* Expanded Row Options */}
                    {isExpanded && (
                      <div className="border-t px-4 py-3 space-y-4">
                        <RadioGroup 
                          value={state.action.type} 
                          onValueChange={(v) => {
                            if (v === 'keep') {
                              setRowAsKeep(row)
                            } else if (v === 'delete') {
                              updateRowAction(row, { action: { type: 'delete' } })
                            } else if (v === 'change_id') {
                              updateRowAction(row, { action: { type: 'change_id', newId: state.newIdValue } })
                            }
                          }}
                        >
                          {/* Keep Option */}
                          <div className={`flex items-start gap-3 p-2 rounded ${
                            state.action.type === 'keep' ? 'bg-green-100' : ''
                          }`}>
                            <RadioGroupItem value="keep" id={`keep-${row}`} className="mt-0.5" />
                            <div className="flex-1">
                              <Label htmlFor={`keep-${row}`} className="font-medium flex items-center gap-2 cursor-pointer">
                                <Check className="w-4 h-4 text-green-600" />
                                Keep with original ID
                              </Label>
                              <p className="text-sm text-gray-500">
                                This row will retain the ID &quot;{duplicate.id}&quot;
                              </p>
                            </div>
                          </div>

                          {/* Change ID Option */}
                          <div className={`flex items-start gap-3 p-2 rounded ${
                            state.action.type === 'change_id' ? 'bg-blue-100' : ''
                          }`}>
                            <RadioGroupItem value="change_id" id={`change-${row}`} className="mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`change-${row}`} className="font-medium flex items-center gap-2 cursor-pointer">
                                <Edit3 className="w-4 h-4 text-blue-600" />
                                Change ID
                              </Label>
                              {state.action.type === 'change_id' && (
                                <div>
                                  <Input
                                    placeholder="Enter new unique ID"
                                    value={state.newIdValue}
                                    onChange={(e) => updateRowAction(row, { 
                                      newIdValue: e.target.value,
                                      action: { type: 'change_id', newId: e.target.value }
                                    })}
                                    className={error ? 'border-red-500' : ''}
                                  />
                                  {error && (
                                    <p className="text-sm text-red-600 mt-1">{error}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Delete Option */}
                          <div className={`flex items-start gap-3 p-2 rounded ${
                            state.action.type === 'delete' ? 'bg-red-100' : ''
                          }`}>
                            <RadioGroupItem value="delete" id={`delete-${row}`} className="mt-0.5" />
                            <div className="flex-1">
                              <Label htmlFor={`delete-${row}`} className="font-medium flex items-center gap-2 cursor-pointer">
                                <Trash2 className="w-4 h-4 text-red-600" />
                                Delete this row
                              </Label>
                              <p className="text-sm text-gray-500">
                                This row will be removed from the upload
                              </p>
                            </div>
                          </div>
                        </RadioGroup>

                        {/* Child Reassignment (when deleting and there are children) */}
                        {state.action.type === 'delete' && rowChildren.length > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Child Assets ({rowChildren.length})
                              </Label>
                              <Tabs 
                                value={state.childMode} 
                                onValueChange={(v) => updateRowAction(row, { childMode: v as ChildMode })}
                                className="h-8"
                              >
                                <TabsList className="h-7">
                                  <TabsTrigger value="simple" className="text-xs h-6 px-2">
                                    Simple
                                  </TabsTrigger>
                                  <TabsTrigger value="advanced" className="text-xs h-6 px-2">
                                    <Settings2 className="w-3 h-3 mr-1" />
                                    Individual
                                  </TabsTrigger>
                                </TabsList>
                              </Tabs>
                            </div>
                            
                            {state.childMode === 'simple' ? (
                              <>
                                <p className="text-sm text-gray-600 mb-2">
                                  What should happen to assets that have this as their parent?
                                </p>
                                <RadioGroup
                                  value={state.simpleChildAction}
                                  onValueChange={(v) => updateRowAction(row, { simpleChildAction: v as SimpleChildAction })}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem value="keep" id={`child-keep-${row}`} />
                                      <Label htmlFor={`child-keep-${row}`} className="cursor-pointer">
                                        Keep pointing to original ID (children inherit the &quot;Keep&quot; row)
                                      </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem value="make_root" id={`child-root-${row}`} />
                                      <Label htmlFor={`child-root-${row}`} className="cursor-pointer">
                                        Make children root assets (remove parent)
                                      </Label>
                                    </div>
                                  </div>
                                </RadioGroup>
                                
                                {/* Preview affected children */}
                                <div className="mt-2 bg-gray-100 rounded p-2 max-h-24 overflow-y-auto">
                                  <p className="text-xs text-gray-500 mb-1">Affected children:</p>
                                  {rowChildren.slice(0, 5).map(child => (
                                    <div key={child.row} className="text-xs text-gray-700">
                                      Row {child.row}: {child.name} ({child.id})
                                    </div>
                                  ))}
                                  {rowChildren.length > 5 && (
                                    <div className="text-xs text-gray-500">
                                      ...and {rowChildren.length - 5} more
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <ChildSelectionPanel
                                childAssets={rowChildren}
                                assignments={state.individualChildAssignments}
                                onAssignmentsChange={(assignments) => 
                                  updateRowAction(row, { individualChildAssignments: assignments })
                                }
                                validParentOptions={getValidParentOptions(row)}
                                defaultKeepParentId={duplicate.id}
                                excludeParentRows={duplicate.rows.filter(r => {
                                  const s = rowActions.get(r)
                                  return s?.action.type === 'delete'
                                })}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={!canApply}
            className="bg-[rgb(52_73_94_/_1)] hover:bg-[rgb(42_63_84_/_1)]"
          >
            Apply Fixes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

