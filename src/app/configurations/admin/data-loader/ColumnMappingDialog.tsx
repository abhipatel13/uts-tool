"use client"

import { useCallback, useMemo, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AssetColumnMappings } from '@/types'
import { ASSET_FIELD_DEFINITIONS, autoGuessColumnMappings } from '@/utils/fileParser'

interface ColumnMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: File | null
  headerColumns: string[]
  onConfirm: (mappings: AssetColumnMappings) => void
}

const NONE_VALUE = '__none__'

export function ColumnMappingDialog({
  open,
  onOpenChange,
  file,
  headerColumns,
  onConfirm,
}: ColumnMappingDialogProps) {
  const [headerMap, setHeaderMap] = useState<Partial<AssetColumnMappings>>({})

  // Auto-guess mappings when headers change
  useEffect(() => {
    if (headerColumns.length > 0) {
      const guessed = autoGuessColumnMappings(headerColumns)
      setHeaderMap(guessed)
    }
  }, [headerColumns])

  const updateMapping = useCallback((key: keyof AssetColumnMappings, value: string) => {
    setHeaderMap(prev => ({
      ...prev,
      [key]: value === NONE_VALUE ? undefined : value,
    }))
  }, [])

  const requiredFields = useMemo(() => 
    ASSET_FIELD_DEFINITIONS.filter(f => f.required),
    []
  )

  const optionalFields = useMemo(() => 
    ASSET_FIELD_DEFINITIONS.filter(f => !f.required),
    []
  )

  // Only check that required fields are mapped
  const isValid = useMemo(() => {
    return requiredFields.every(
      field => headerMap[field.key] && headerMap[field.key] !== NONE_VALUE
    )
  }, [requiredFields, headerMap])

  const handleConfirm = useCallback(() => {
    if (!isValid) return

    // Build the final mappings object
    const mappings: AssetColumnMappings = {
      id: headerMap.id!,
      name: headerMap.name!,
    }

    // Add optional mappings if they're set
    for (const field of optionalFields) {
      if (headerMap[field.key]) {
        mappings[field.key] = headerMap[field.key]!
      }
    }

    onConfirm(mappings)
  }, [isValid, headerMap, optionalFields, onConfirm])

  const renderFieldMapping = (field: typeof ASSET_FIELD_DEFINITIONS[0], isRequired: boolean) => (
    <div 
      key={field.key} 
      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg ${
        isRequired ? 'bg-blue-50 border border-blue-200' : ''
      }`}
    >
      <Label className={`sm:min-w-56 ${isRequired ? 'font-semibold text-blue-900' : ''}`}>
        {field.label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select 
        value={headerMap[field.key] || NONE_VALUE} 
        onValueChange={(v) => updateMapping(field.key, v)}
      >
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="Select a column" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>
            {isRequired ? 'Select a column' : '— None —'}
          </SelectItem>
          {headerColumns.filter(header => header.trim() !== '').map(header => (
            <SelectItem key={header} value={header}>{header}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#2C3E50]">
            Map CSV/Excel Columns
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* File info */}
          {file && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <span className="font-medium">{file.name}</span>
              <span className="text-gray-500 ml-2">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <span className="text-gray-500 ml-2">
                • {headerColumns.length} columns detected
              </span>
            </div>
          )}

          {/* Required fields section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Required</span>
              Map these columns to proceed
            </h3>
            <div className="space-y-2">
              {requiredFields.map(field => renderFieldMapping(field, true))}
            </div>
          </div>

          {/* Optional fields section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">Optional</span>
              Additional mappings (defaults applied if not mapped)
            </h3>
            <div className="space-y-2">
              {optionalFields.map(field => renderFieldMapping(field, false))}
            </div>
          </div>

          {/* Helper text */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p className="mb-1">
              <strong>Note:</strong> You can map the same source column to multiple system fields.
            </p>
            <p>
              After mapping, your file will be validated for duplicates, orphans, and circular dependencies.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!isValid}
              className="bg-[rgb(52_73_94_/_1)] hover:bg-[rgb(42_63_84_/_1)]"
            >
              Continue to Validation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
