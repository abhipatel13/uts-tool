"use client"

import { useState, useMemo, useEffect } from 'react'
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
import { OrphanInfo, OrphanGroup } from '@/types/validation'
import { ParentOption } from './hooks/useAssetValidation'
import { Search, AlertCircle, Users } from 'lucide-react'

interface OrphanFixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Single mode - fix one orphan
  orphan?: OrphanInfo | null
  // Group mode - fix all orphans referencing the same missing parent
  orphanGroup?: OrphanGroup | null
  // Valid parent options for reassignment
  validParentOptions: ParentOption[]
  // Single mode handlers
  onRemoveParent: (row: number) => void
  onChangeParent: (row: number, newParentId: string) => void
  // Group mode handler for bulk remove
  onBulkRemoveOrphanParents?: (group: OrphanGroup) => void
}

type FixType = 'remove' | 'reassign'

export function OrphanFixDialog({
  open,
  onOpenChange,
  orphan,
  orphanGroup,
  validParentOptions,
  onRemoveParent,
  onChangeParent,
  onBulkRemoveOrphanParents,
}: OrphanFixDialogProps) {
  const [fixType, setFixType] = useState<FixType>('remove')
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Determine mode based on which prop is provided
  const mode = useMemo(() => {
    if (orphanGroup && orphanGroup.orphans.length > 0) return 'group'
    if (orphan) return 'single'
    return null
  }, [orphan, orphanGroup])

  // Get the missing parent ID for display
  const missingParentId = useMemo(() => {
    if (mode === 'group' && orphanGroup) return orphanGroup.missingParentId
    if (mode === 'single' && orphan) return orphan.missingParentId
    return ''
  }, [mode, orphan, orphanGroup])

  // Get count of affected assets
  const affectedCount = useMemo(() => {
    if (mode === 'group' && orphanGroup) return orphanGroup.orphans.length
    return 1
  }, [mode, orphanGroup])

  // Filter parent options by search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return validParentOptions
    const query = searchQuery.toLowerCase()
    return validParentOptions.filter(opt => 
      opt.id.toLowerCase().includes(query) ||
      opt.name.toLowerCase().includes(query)
    )
  }, [validParentOptions, searchQuery])

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFixType('remove')
      setSelectedParentId('')
      setSearchQuery('')
    }
  }, [open, orphan, orphanGroup])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFixType('remove')
      setSelectedParentId('')
      setSearchQuery('')
    }
    onOpenChange(isOpen)
  }

  const handleApply = () => {
    if (!mode) return

    if (mode === 'single' && orphan) {
      // Single mode
      if (fixType === 'remove') {
        onRemoveParent(orphan.row)
      } else if (fixType === 'reassign' && selectedParentId) {
        onChangeParent(orphan.row, selectedParentId)
      }
    } else if (mode === 'group' && orphanGroup) {
      // Group mode
      if (fixType === 'remove') {
        // Use bulk remove if available, otherwise iterate
        if (onBulkRemoveOrphanParents) {
          onBulkRemoveOrphanParents(orphanGroup)
        } else {
          orphanGroup.orphans.forEach(o => onRemoveParent(o.row))
        }
      } else if (fixType === 'reassign' && selectedParentId) {
        // Reassign all orphans in the group to the new parent
        orphanGroup.orphans.forEach(o => onChangeParent(o.row, selectedParentId))
      }
    }
    
    handleOpenChange(false)
  }

  const canApply = fixType === 'remove' || (fixType === 'reassign' && selectedParentId)

  if (!mode) return null

  // Determine modal width based on mode and whether reassign is selected
  const modalWidth = fixType === 'reassign' 
    ? '!max-w-xl' 
    : mode === 'group' 
      ? '!max-w-lg' 
      : '!max-w-md'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`${modalWidth} transition-all`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            {mode === 'single' ? 'Fix Orphaned Asset' : 'Fix Orphan Group'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'single' 
              ? 'Choose how to handle the invalid parent reference.'
              : `Choose how to handle ${affectedCount} assets with invalid parent reference.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden">
          {/* Asset/Group Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 overflow-hidden">
            {mode === 'single' && orphan && (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-gray-500 flex-shrink-0">Row {orphan.row}</span>
                  <span className="font-mono text-sm bg-white px-2 py-0.5 rounded border truncate" title={orphan.assetId}>
                    {orphan.assetId}
                  </span>
                </div>
                <div className="font-medium truncate" title={orphan.assetName}>{orphan.assetName}</div>
              </>
            )}
            
            {mode === 'group' && orphanGroup && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{affectedCount} asset{affectedCount !== 1 ? 's' : ''}</span>
                <span className="text-gray-500">referencing missing parent</span>
              </div>
            )}
            
            <div className="text-sm text-red-600 flex items-center gap-1 min-w-0">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span className="truncate" title={`Parent "${missingParentId}" not found`}>
                Parent &quot;{missingParentId}&quot; not found
              </span>
            </div>

            {/* Show affected assets preview for group mode */}
            {mode === 'group' && orphanGroup && orphanGroup.orphans.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Affected assets:</div>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {orphanGroup.orphans.slice(0, 5).map((o) => (
                    <div key={o.row} className="text-xs flex items-center gap-2 min-w-0">
                      <span className="text-gray-400 flex-shrink-0 w-14">Row {o.row}</span>
                      <span className="font-mono bg-white px-1.5 py-0.5 rounded border text-gray-700 truncate max-w-[140px]" title={o.assetId}>
                        {o.assetId}
                      </span>
                      <span className="text-gray-600 truncate flex-1 min-w-0" title={o.assetName}>{o.assetName}</span>
                    </div>
                  ))}
                  {orphanGroup.orphans.length > 5 && (
                    <div className="text-xs text-gray-500">
                      ...and {orphanGroup.orphans.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fix Options */}
          <RadioGroup value={fixType} onValueChange={(v) => setFixType(v as FixType)}>
            <div className="space-y-3">
              {/* Remove Parent Option */}
              <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                fixType === 'remove' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
              }`}>
                <Label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="remove" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      Remove parent reference
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {mode === 'single' 
                        ? 'Makes this asset a root-level asset with no parent.'
                        : `Makes all ${affectedCount} assets root-level assets with no parent.`
                      }
                    </p>
                  </div>
                </Label>
              </div>

              {/* Assign New Parent Option */}
              <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                fixType === 'reassign' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
              }`}>
                <Label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="reassign" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      Assign new parent
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {mode === 'single'
                        ? 'Choose an existing asset as the new parent.'
                        : `Choose an existing asset as the new parent for all ${affectedCount} assets.`
                      }
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Parent Selection (when reassign is selected) */}
          {fixType === 'reassign' && (
            <div className="space-y-2 overflow-hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by ID or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="h-48 border rounded-lg overflow-y-auto">
                <div className="p-1">
                  {filteredOptions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      {searchQuery ? 'No matches found' : 'No valid parents available'}
                    </div>
                  ) : (
                    filteredOptions.map((option) => (
                      <button
                        key={option.row}
                        type="button"
                        onClick={() => setSelectedParentId(option.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedParentId === option.id
                            ? 'bg-blue-100 text-blue-900'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-mono text-xs text-gray-500 truncate" title={option.id}>{option.id}</div>
                        <div className="font-medium truncate" title={option.name}>{option.name}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {selectedParentId && (
                <div className="text-sm text-blue-600 bg-blue-50 rounded px-3 py-2 truncate" title={`Selected: ${selectedParentId}`}>
                  Selected: <span className="font-medium">{selectedParentId}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={!canApply}
              className="bg-[rgb(52_73_94_/_1)] hover:bg-[rgb(42_63_84_/_1)]"
            >
              {mode === 'single' ? 'Apply Fix' : `Apply to ${affectedCount} Assets`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
