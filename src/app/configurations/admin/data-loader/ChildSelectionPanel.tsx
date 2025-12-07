"use client"

import { useState, useMemo, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChildAssetInfo, ParentOption } from './hooks/useAssetValidation'
import { 
  Search, 
  Users, 
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Minus,
  Check
} from 'lucide-react'

// Action for a single child
export type ChildAssignmentAction = 
  | { type: 'keep' }           // Keep current parent reference
  | { type: 'reassign'; newParentId: string }  // Reassign to specific parent
  | { type: 'make_root' }      // Remove parent (make root asset)

export interface ChildAssignments {
  [childRow: number]: ChildAssignmentAction
}

interface ChildSelectionPanelProps {
  childAssets: ChildAssetInfo[]
  assignments: ChildAssignments
  onAssignmentsChange: (assignments: ChildAssignments) => void
  validParentOptions: ParentOption[]
  defaultKeepParentId?: string  // The ID that "keep" will point to
  excludeParentRows?: number[]  // Rows to exclude from parent options (being deleted)
}

export function ChildSelectionPanel({
  childAssets,
  assignments,
  onAssignmentsChange,
  validParentOptions,
  defaultKeepParentId,
  excludeParentRows = [],
}: ChildSelectionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  // Filter children by search
  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return childAssets
    const query = searchQuery.toLowerCase()
    return childAssets.filter(child => 
      child.id.toLowerCase().includes(query) ||
      child.name.toLowerCase().includes(query) ||
      child.row.toString().includes(query)
    )
  }, [childAssets, searchQuery])

  // Filter parent options to exclude deleted rows
  const availableParents = useMemo(() => {
    return validParentOptions.filter(p => !excludeParentRows.includes(p.row))
  }, [validParentOptions, excludeParentRows])

  // Get the action for a child
  const getAction = useCallback((childRow: number): ChildAssignmentAction => {
    return assignments[childRow] || { type: 'keep' }
  }, [assignments])

  // Update a single child's action
  const updateChildAction = useCallback((childRow: number, action: ChildAssignmentAction) => {
    onAssignmentsChange({
      ...assignments,
      [childRow]: action
    })
  }, [assignments, onAssignmentsChange])

  // Bulk update selected children
  const bulkUpdateSelected = useCallback((action: ChildAssignmentAction) => {
    const newAssignments = { ...assignments }
    selectedRows.forEach(row => {
      newAssignments[row] = action
    })
    onAssignmentsChange(newAssignments)
    setSelectedRows(new Set())
  }, [assignments, selectedRows, onAssignmentsChange])

  // Toggle selection
  const toggleSelection = useCallback((row: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(row)) {
        next.delete(row)
      } else {
        next.add(row)
      }
      return next
    })
  }, [])

  // Select/deselect all filtered
  const toggleSelectAll = useCallback(() => {
    if (selectedRows.size === filteredChildren.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredChildren.map(c => c.row)))
    }
  }, [filteredChildren, selectedRows])

  // Count by action type
  const actionCounts = useMemo(() => {
    const counts = { keep: 0, reassign: 0, make_root: 0 }
    childAssets.forEach(child => {
      const action = getAction(child.row)
      counts[action.type === 'reassign' ? 'reassign' : action.type]++
    })
    return counts
  }, [childAssets, getAction])

  if (childAssets.length === 0) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm">
            Child Assets ({childAssets.length})
          </span>
          <div className="flex gap-1">
            {actionCounts.keep > 0 && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Keep: {actionCounts.keep}
              </Badge>
            )}
            {actionCounts.reassign > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Reassign: {actionCounts.reassign}
              </Badge>
            )}
            {actionCounts.make_root > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Root: {actionCounts.make_root}
              </Badge>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t p-3 space-y-3">
          {/* Search and Bulk Actions */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search children..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">{selectedRows.size} selected:</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={() => bulkUpdateSelected({ type: 'keep' })}
                >
                  Keep All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={() => bulkUpdateSelected({ type: 'make_root' })}
                >
                  Make Root
                </Button>
              </div>
            )}
          </div>

          {/* Select All */}
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selectedRows.size === filteredChildren.length && filteredChildren.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <Label className="text-xs text-gray-600 cursor-pointer" onClick={toggleSelectAll}>
              Select All ({filteredChildren.length})
            </Label>
          </div>

          {/* Child List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredChildren.map(child => {
              const action = getAction(child.row)
              const isSelected = selectedRows.has(child.row)

              return (
                <div 
                  key={child.row}
                  className={`flex items-center gap-2 p-2 rounded border ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelection(child.row)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs shrink-0">
                        Row {child.row}
                      </Badge>
                      <span className="text-sm truncate">{child.name}</span>
                      <span className="text-xs text-gray-400 font-mono truncate">
                        {child.id}
                      </span>
                    </div>
                  </div>

                  {/* Action Selector */}
                  <Select
                    value={action.type === 'reassign' ? `reassign:${action.newParentId}` : action.type}
                    onValueChange={(v) => {
                      if (v === 'keep') {
                        updateChildAction(child.row, { type: 'keep' })
                      } else if (v === 'make_root') {
                        updateChildAction(child.row, { type: 'make_root' })
                      } else if (v.startsWith('reassign:')) {
                        const newParentId = v.replace('reassign:', '')
                        updateChildAction(child.row, { type: 'reassign', newParentId })
                      }
                    }}
                  >
                    <SelectTrigger className="w-40 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-600" />
                          <span>Keep Parent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="make_root">
                        <div className="flex items-center gap-1">
                          <Minus className="w-3 h-3 text-amber-600" />
                          <span>Make Root</span>
                        </div>
                      </SelectItem>
                      {availableParents.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs text-gray-500 font-medium">
                            Reassign to:
                          </div>
                          {availableParents.slice(0, 10).map(parent => (
                            <SelectItem 
                              key={parent.row} 
                              value={`reassign:${parent.id}`}
                            >
                              <div className="flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 text-blue-600" />
                                <span className="truncate max-w-28">{parent.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {availableParents.length > 10 && (
                            <div className="px-2 py-1 text-xs text-gray-400">
                              +{availableParents.length - 10} more...
                            </div>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          {defaultKeepParentId && actionCounts.keep > 0 && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
              <strong>{actionCounts.keep}</strong> children will keep pointing to ID &quot;{defaultKeepParentId}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}

