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
import { MissingNameInfo } from '@/types/validation'
import { ChildAssetInfo, ParentOption } from './hooks/useAssetValidation'
import { FileX, AlertCircle, Users, Trash2, Edit3, Search } from 'lucide-react'

interface MissingNameFixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  missingName: MissingNameInfo | null
  // Get children of this asset (to warn about deletion impact)
  getChildrenOfAsset: (assetId: string) => ChildAssetInfo[]
  // Get valid parent options for child reassignment
  getValidParentOptions: (excludeRow: number) => ParentOption[]
  // Actions
  onUpdateName: (row: number, newName: string) => void
  onDeleteRow: (row: number) => void
  onReassignChildren: (childRows: number[], newParentId: string | null) => void
}

type FixType = 'add_name' | 'delete'
type ChildAction = 'reassign' | 'make_root'

export function MissingNameFixDialog({
  open,
  onOpenChange,
  missingName,
  getChildrenOfAsset,
  getValidParentOptions,
  onUpdateName,
  onDeleteRow,
  onReassignChildren,
}: MissingNameFixDialogProps) {
  const [fixType, setFixType] = useState<FixType>('add_name')
  const [newName, setNewName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  
  // Deletion child handling
  const [childAction, setChildAction] = useState<ChildAction>('make_root')
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Get children of this asset
  const children = useMemo(() => {
    if (!missingName) return []
    return getChildrenOfAsset(missingName.assetId)
  }, [missingName, getChildrenOfAsset])

  // Get valid parent options (excluding this row)
  const validParentOptions = useMemo(() => {
    if (!missingName) return []
    return getValidParentOptions(missingName.row)
  }, [missingName, getValidParentOptions])

  // Filter parent options by search
  const filteredParentOptions = useMemo(() => {
    if (!searchQuery.trim()) return validParentOptions
    const query = searchQuery.toLowerCase()
    return validParentOptions.filter(opt => 
      opt.id.toLowerCase().includes(query) ||
      opt.name.toLowerCase().includes(query)
    )
  }, [validParentOptions, searchQuery])

  // Reset state when dialog opens
  useEffect(() => {
    if (open && missingName) {
      setFixType('add_name')
      setNewName('')
      setNameError(null)
      setChildAction('make_root')
      setSelectedParentId('')
      setSearchQuery('')
    }
  }, [open, missingName])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFixType('add_name')
      setNewName('')
      setNameError(null)
      setChildAction('make_root')
      setSelectedParentId('')
      setSearchQuery('')
    }
    onOpenChange(isOpen)
  }

  const validateName = (): boolean => {
    if (!newName.trim()) {
      setNameError('Name is required')
      return false
    }
    setNameError(null)
    return true
  }

  const handleApply = () => {
    if (!missingName) return

    if (fixType === 'add_name') {
      if (!validateName()) return
      onUpdateName(missingName.row, newName.trim())
    } else if (fixType === 'delete') {
      // Handle children first if there are any
      if (children.length > 0) {
        const childRows = children.map(c => c.row)
        if (childAction === 'make_root') {
          onReassignChildren(childRows, null)
        } else if (childAction === 'reassign' && selectedParentId) {
          onReassignChildren(childRows, selectedParentId)
        }
      }
      onDeleteRow(missingName.row)
    }
    
    handleOpenChange(false)
  }

  const canApply = useMemo(() => {
    if (fixType === 'add_name') {
      return newName.trim().length > 0
    }
    if (fixType === 'delete') {
      // If no children, can always delete
      if (children.length === 0) return true
      // If has children, need valid child action
      if (childAction === 'make_root') return true
      if (childAction === 'reassign') return selectedParentId !== ''
    }
    return false
  }, [fixType, newName, children.length, childAction, selectedParentId])

  if (!missingName) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileX className="w-5 h-5 text-blue-500" />
            Fix Missing Name
          </DialogTitle>
          <DialogDescription>
            This asset is missing a required name. Add a name or delete the row.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Row {missingName.row}</span>
              <span className="font-mono text-sm bg-white px-2 py-0.5 rounded border">
                {missingName.assetId}
              </span>
            </div>
            {missingName.parentId && (
              <div className="text-sm text-gray-600">
                Parent: <span className="font-mono">{missingName.parentId}</span>
              </div>
            )}
            <div className="text-sm text-blue-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Name is required but missing
            </div>
            {children.length > 0 && (
              <div className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                <Users className="w-3 h-3" />
                {children.length} child asset{children.length !== 1 ? 's' : ''} reference this as parent
              </div>
            )}
          </div>

          {/* Fix Options */}
          <RadioGroup value={fixType} onValueChange={(v) => setFixType(v as FixType)}>
            <div className="space-y-3">
              {/* Add Name Option */}
              <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                fixType === 'add_name' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
              }`}>
                <Label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="add_name" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Edit3 className="w-4 h-4 text-blue-600" />
                      Add name
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter a name for this asset.
                    </p>
                  </div>
                </Label>
              </div>

              {/* Delete Option */}
              <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                fixType === 'delete' ? 'border-red-500 bg-red-50' : 'hover:border-gray-300'
              }`}>
                <Label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="delete" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      Delete row
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Remove this asset from the upload.
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Name Input (when add_name selected) */}
          {fixType === 'add_name' && (
            <div className="space-y-2">
              <Label htmlFor="asset-name">Asset Name</Label>
              <Input
                id="asset-name"
                placeholder="Enter asset name..."
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  if (nameError) setNameError(null)
                }}
                className={nameError ? 'border-red-500' : ''}
                autoFocus
              />
              {nameError && (
                <p className="text-sm text-red-600">{nameError}</p>
              )}
            </div>
          )}

          {/* Child Handling (when delete selected and has children) */}
          {fixType === 'delete' && children.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <AlertCircle className="w-4 h-4" />
                This asset has {children.length} child asset{children.length !== 1 ? 's' : ''}
              </div>
              
              <p className="text-sm text-gray-600">
                What should happen to the child assets?
              </p>

              <RadioGroup value={childAction} onValueChange={(v) => setChildAction(v as ChildAction)}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="make_root" id="child-make-root" />
                    <Label htmlFor="child-make-root" className="cursor-pointer">
                      Make children root assets (remove parent)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="reassign" id="child-reassign" />
                    <Label htmlFor="child-reassign" className="cursor-pointer">
                      Reassign children to another parent
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {/* Parent Selection for reassignment */}
              {childAction === 'reassign' && (
                <div className="space-y-2 ml-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by ID or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="h-32 border rounded-lg overflow-y-auto">
                    <div className="p-1">
                      {filteredParentOptions.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          {searchQuery ? 'No matches found' : 'No valid parents available'}
                        </div>
                      ) : (
                        filteredParentOptions.map((option) => (
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
                            <div className="font-mono text-xs text-gray-500">{option.id}</div>
                            <div className="font-medium">{option.name}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {selectedParentId && (
                    <div className="text-sm text-blue-600 bg-blue-50 rounded px-3 py-2">
                      Selected: <span className="font-medium">{selectedParentId}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Preview affected children */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 max-h-24 overflow-y-auto">
                <p className="text-xs text-amber-700 mb-1 font-medium">Affected children:</p>
                {children.slice(0, 5).map(child => (
                  <div key={child.row} className="text-xs text-amber-800">
                    Row {child.row}: {child.name || '(no name)'} ({child.id})
                  </div>
                ))}
                {children.length > 5 && (
                  <div className="text-xs text-amber-600">
                    ...and {children.length - 5} more
                  </div>
                )}
              </div>
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
              className={fixType === 'delete' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-[rgb(52_73_94_/_1)] hover:bg-[rgb(42_63_84_/_1)]'
              }
            >
              {fixType === 'add_name' ? 'Save Name' : 'Delete Row'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

