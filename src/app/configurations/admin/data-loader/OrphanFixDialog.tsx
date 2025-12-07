"use client"

import { useState, useMemo } from 'react'
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
import { OrphanInfo } from '@/types/validation'
import { ParentOption } from './hooks/useAssetValidation'
import { Search, AlertCircle } from 'lucide-react'

interface OrphanFixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orphan: OrphanInfo | null
  validParentOptions: ParentOption[]
  onRemoveParent: (row: number) => void
  onChangeParent: (row: number, newParentId: string) => void
}

export function OrphanFixDialog({
  open,
  onOpenChange,
  orphan,
  validParentOptions,
  onRemoveParent,
  onChangeParent,
}: OrphanFixDialogProps) {
  const [fixType, setFixType] = useState<'remove' | 'reassign'>('remove')
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter parent options by search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return validParentOptions
    const query = searchQuery.toLowerCase()
    return validParentOptions.filter(opt => 
      opt.id.toLowerCase().includes(query) ||
      opt.name.toLowerCase().includes(query)
    )
  }, [validParentOptions, searchQuery])

  // Reset state when dialog opens with new orphan
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFixType('remove')
      setSelectedParentId('')
      setSearchQuery('')
    }
    onOpenChange(isOpen)
  }

  const handleApply = () => {
    if (!orphan) return

    if (fixType === 'remove') {
      onRemoveParent(orphan.row)
    } else if (fixType === 'reassign' && selectedParentId) {
      onChangeParent(orphan.row, selectedParentId)
    }
    handleOpenChange(false)
  }

  const canApply = fixType === 'remove' || (fixType === 'reassign' && selectedParentId)

  if (!orphan) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Fix Orphaned Asset
          </DialogTitle>
          <DialogDescription>
            Choose how to handle the invalid parent reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Row {orphan.row}</span>
              <span className="font-mono text-sm bg-white px-2 py-0.5 rounded border">
                {orphan.assetId}
              </span>
            </div>
            <div className="font-medium">{orphan.assetName}</div>
            <div className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Parent &quot;{orphan.missingParentId}&quot; not found
            </div>
          </div>

          {/* Fix Options */}
          <RadioGroup value={fixType} onValueChange={(v) => setFixType(v as 'remove' | 'reassign')}>
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
                      Makes this asset a root-level asset with no parent.
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
                      Choose an existing asset as the new parent.
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Parent Selection (when reassign is selected) */}
          {fixType === 'reassign' && (
            <div className="space-y-2">
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
              Apply Fix
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

