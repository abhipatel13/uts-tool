"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ChevronRight, ChevronDown, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { assetHierarchyApi, Asset } from "@/services/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const sampleCsvContent = `Maintenance Plant,Primary Key,CMMS Internal ID,Functional Location,Parent,CMMS System,Site Reference Name,Functional Location Description,Functional Location Long Description,Object Type (Taxonomy Mapping Value),System Status,Make,Manufacturer,Serial Number
AH_FLOC_MAINT_PLNT_C,AH_FLOC_PKEY,AH_FLOC_INTERNAL_ID_C,AH_FLOC_FNC_LOC_C,AH_FLOC_PARENT,AH_FLOC_SAP_SYSTEM_C,MI_SITE_NAME,AH_FLOC_FNC_LOC_DESC_C,AH_FLOC_FNC_LOC_LNG_DESC_C,AH_FLOC_OBJ_TYP_C,AH_FLOC_SYS_STATUS_C,,,
System generated from last number,,,includes the priary key bu referring the table with the Functional location value,,,,,,,,,,
Off-Site Support,Cars-001,IID001,Cars,,,"Salt Lake City, UT",Car Fans,Car Fans,,Active,,,
Off-Site Support,Cars-002,IID002,Cars-Honda,Cars,,"Salt Lake City, UT",D-Dog Car,D-Dog Car,,Active,,,
Off-Site Support,Cars-003,IID003,Cars-Honda-Engine,Cars-Honda,,"Salt Lake City, UT",D-Dog Car Engine,D-Dog Car Engine,,Active,,,
Off-Site Support,Cars-004,IID004,Cars-Honda-Trans,Cars-Honda,,"Salt Lake City, UT",D-Dog Car Trans,D-Dog Car Trans,,Active,,,
Off-Site Support,Cars-005,IID005,Cars-Honda-Oil Filter,Cars-Honda-Engine,,"Salt Lake City, UT",D-Dog Car Enginer Oil Filter,D-Dog Car Enginer Oil Filter,,Active,,,
SLC,SLC-001,IID006,SLC,,,"Salt Lake City, UT",Area,Area,,Active,,,
SLC,SLC-002,IID007,SLC-HOUSES,SLC,,"Salt Lake City, UT",Houses,Houses,,Active,,,
SLC,SLC-003,IID008,SLC-HOUSE-1,SLC-HOUSES,,"Salt Lake City, UT",House 1,House 1,,Active,,,
SLC,SLC-004,IID009,SLC-HOUSE-2,SLC-HOUSES,,"Salt Lake City, UT",House 2,House 2,,Active,,,
SLC,SLC-005,IID010,SLC-HOUSE-3,SLC-HOUSES,,"Salt Lake City, UT",House 3,House 3,,Active,,,
SLC,SLC-006,IID011,SLC-LOTS,SLC,,"Salt Lake City, UT",Lots,Lots,,Active,,,
SLC,SLC-007,IID012,SLC-LOT-1,SLC-LOTS,,"Salt Lake City, UT",Lot 1,Lot 1,,Active,,,
SLC,SLC-008,IID013,SLC-LOT-2,SLC-LOTS,,"Salt Lake City, UT",Lot 2,Lot 2,,Active,,,
SLC,SLC-009,IID014,SLC-LOT-3,SLC-LOTS,,"Salt Lake City, UT",Lot 3,Lot 3,,Active,,,
SLC,SLC-010,IID015,SLC-HOUSE-1-MECH,SLC-HOUSE-1,,"Salt Lake City, UT",House 1 Mech,House 1 Mech,,Active,,,
SLC,SLC-011,IID016,SLC-HOUSE-3-MECH,SLC-HOUSE-3,,"Salt Lake City, UT",House 3 Mech,House 3 Mech,,Active,,,
SLC,SLC-012,IID017,SLC-HOUSE-2-MECH,SLC-HOUSE-2,,"Salt Lake City, UT",House 2 Mech,House 2 Mech,,Active,,,
Off-Site Support,BLDG-001,IID018,BLDG,,,"Salt Lake City, UT",Building,Building,,Active,,,
Off-Site Support,BLDG-002,IID019,BLDG 1,BLDG,,"Salt Lake City, UT",Building 1,Building 1,,Active,,,
Off-Site Support,BLDG-003,IID020,BLDG 2,BLDG,,"Salt Lake City, UT",Building 2,Building 2,,Active,,,
Off-Site Support,BLDG-004,IID021,BLDG 1 MECH,BLDG 1,,"Salt Lake City, UT",Building 1 Mech,Building 1 Mech,,Active,,,
Off-Site Support,BLDG-005,IID022,BLDG 2 MECH,BLDG 2,,"Salt Lake City, UT",Building 2 Mech,Building 2 Mech,,Active,,,`

export default function DataLoader() {
  const { toast } = useToast()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch assets when component mounts
  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await assetHierarchyApi.getAll()
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from server')
      }

      // Convert Asset[] to ExtendedAsset[]
      const extendedAssets: Asset[] = response.data.map(asset => ({
        ...asset,
        details: {
          maintenancePlant: '',
          primaryKey: '',
          internalId: asset.id,
          functionalLocation: asset.id,
          parent: asset.parent,
          cmmsSystem: '',
          siteReference: '',
          description: asset.name,
          longDescription: asset.description,
          objectType: '',
          systemStatus: 'Active',
          make: '',
          manufacturer: '',
          serialNumber: ''
        }
      }))

      setAssets(extendedAssets)
      
      // Expand root level assets by default
      const rootAssets = new Set(
        extendedAssets
          .filter((asset: Asset) => asset.level === 0)
          .map((asset: Asset) => asset.id)
      )
      setExpandedAssets(rootAssets)
    } catch (err) {
      console.error('Error fetching assets:', err)
      setError('Failed to load assets. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const parseCSV = (csvText: string): Asset[] => {
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    // Validate headers
    const requiredHeaders = [
      'Maintenance Plant',
      'Primary Key',
      'CMMS Internal ID',
      'Functional Location',
      'Parent',
      'CMMS System',
      'Site Reference Name',
      'Functional Location Description',
      'Functional Location Long Description',
      'Object Type (Taxonomy Mapping Value)',
      'System Status',
      'Make',
      'Manufacturer',
      'Serial Number'
    ]
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
    }

    // Parse data rows
    const assets: Asset[] = []
    const parentMap = new Map<string, string>()
    
    // Skip header and field description rows (first two rows)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.trim())
      
      // Skip the field description row
      if (values[headers.indexOf('Maintenance Plant')] === 'System generated from last number') {
        continue
      }
      
      // Check if required fields exist in the row
      const functionalLocation = values[headers.indexOf('Functional Location')]
      const description = values[headers.indexOf('Functional Location Description')]
      
      // Skip empty rows
      if (!functionalLocation && !description) {
        continue
      }
      
      if (!functionalLocation || !description) {
        throw new Error(`Row ${i + 1}: Both Functional Location and Description are required`)
      }

      const parent = values[headers.indexOf('Parent')] || null
      if (parent) {
        parentMap.set(functionalLocation, parent)
      }

      const asset: Asset = {
        id: functionalLocation,
        internalId: values[headers.indexOf('CMMS Internal ID')] || '',
        name: description,
        description: values[headers.indexOf('Functional Location Long Description')] || description,
        parent: parent,
        maintenancePlant: values[headers.indexOf('Maintenance Plant')] || '',
        primaryKey: values[headers.indexOf('Primary Key')] || '',
        cmmsSystem: values[headers.indexOf('CMMS System')] || '',
        siteReference: values[headers.indexOf('Site Reference Name')] || '',
        objectType: values[headers.indexOf('Object Type (Taxonomy Mapping Value)')] || '',
        systemStatus: values[headers.indexOf('System Status')] || 'Active',
        make: values[headers.indexOf('Make')] || '',
        manufacturer: values[headers.indexOf('Manufacturer')] || '',
        serialNumber: values[headers.indexOf('Serial Number')] || '',
        level: 0,  // Will be calculated after all assets are collected
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      assets.push(asset)
    }
    
    if (assets.length === 0) {
      throw new Error('No valid assets found in the CSV file')
    }
    
    // Calculate levels
    assets.forEach(asset => {
      let level = 0
      let currentParent = asset.parent
      
      while (currentParent) {
        level++
        currentParent = parentMap.get(currentParent) || null
      }
      
      asset.level = level
    })

    return assets
  }

  const validateHierarchy = (assets: Asset[]) => {
    const assetIds = new Set(assets.map(a => a.id))
    const errors: string[] = []

    // Check for duplicate Asset IDs
    const duplicates = assets.filter((asset, index) => 
      assets.findIndex(a => a.id === asset.id) !== index
    )
    if (duplicates.length > 0) {
      errors.push(`Duplicate Asset IDs found: ${duplicates.map(d => d.id).join(', ')}`)
    }

    // Check for invalid parent references
    const invalidParents = assets.filter(asset => 
      asset.parent && !assetIds.has(asset.parent)
    )
    if (invalidParents.length > 0) {
      errors.push(`Invalid parent references found: ${invalidParents.map(a => `${a.id} -> ${a.parent}`).join(', ')}`)
    }

    // Check for circular references
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const checkCircular = (assetId: string): boolean => {
      if (recursionStack.has(assetId)) {
        return true
      }
      if (visited.has(assetId)) {
        return false
      }

      visited.add(assetId)
      recursionStack.add(assetId)

      const asset = assets.find(a => a.id === assetId)
      if (asset?.parent) {
        if (checkCircular(asset.parent)) {
          return true
        }
      }

      recursionStack.delete(assetId)
      return false
    }

    for (const asset of assets) {
      if (checkCircular(asset.id)) {
        errors.push(`Circular reference detected in hierarchy involving Asset ID: ${asset.id}`)
        break
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'))
    }

    return true
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setIsUploading(true)

    try {
      // Read file content for client-side validation
      const text = await file.text()
      
      // Parse and validate CSV
      const assets = parseCSV(text)
      validateHierarchy(assets)

      // Create FormData and append file
      const formData = new FormData()
      formData.append('file', file)

      // Make the API call
      const response = await fetch('/api/asset-hierarchy/upload-csv', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload file')
      }

      const data = await response.json()

      // Refresh the assets list
      await fetchAssets()

      setShowUploadDialog(false)
      toast({
        title: "Success!",
        description: `Successfully uploaded ${data.data.length} assets.`,
        variant: "default",
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
      setUploadError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'asset-hierarchy-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const toggleAsset = (assetId: string) => {
    setExpandedAssets(prev => {
      const next = new Set(prev)
      if (next.has(assetId)) {
        next.delete(assetId)
      } else {
        next.add(assetId)
      }
      return next
    })
  }

  const hasChildren = (assetId: string) => {
    return assets.some(a => a.parent === assetId)
  }

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset)
    setShowDetailsDialog(true)
  }

  const renderAssets = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={3} className="text-center py-8">
            Loading assets...
          </td>
        </tr>
      )
    }

    if (error) {
      return (
        <tr>
          <td colSpan={3} className="text-center py-8 text-red-500">
            {error}
          </td>
        </tr>
      )
    }

    if (assets.length === 0) {
      return (
        <tr>
          <td colSpan={3} className="text-center py-8 text-gray-500">
            No assets found. Import a CSV file to get started.
          </td>
        </tr>
      )
    }

    const visibleAssets = assets.filter(asset => {
      if (asset.level === 0) return true
      
      let currentParent = asset.parent
      while (currentParent) {
        if (!expandedAssets.has(currentParent)) return false
        const parentAsset = assets.find(a => a.id === currentParent)
        currentParent = parentAsset?.parent || null
      }
      return true
    })

    return visibleAssets.map((asset) => (
      <tr key={asset.id} className="border-b hover:bg-gray-50">
        <td className="p-4">
          <div className="flex items-center" style={{ paddingLeft: `${asset.level * 20}px` }}>
            {hasChildren(asset.id) ? (
              <button
                onClick={() => toggleAsset(asset.id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded-md focus:outline-none"
              >
                {expandedAssets.has(asset.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            <span>{asset.name}</span>
          </div>
        </td>
        <td 
          className="p-4 cursor-pointer hover:text-blue-600 flex items-center gap-2"
          onClick={() => handleAssetClick(asset)}
        >
          {asset.description}
          <Info className="h-4 w-4" />
        </td>
      </tr>
    ))
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Data Loader</h1>
          <p className="text-gray-600">Import your asset hierarchy data here.</p>
        </div>
        <Button 
          className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 gap-2"
          onClick={() => setShowUploadDialog(true)}
        >
          <Upload className="h-4 w-4" /> Import CSV
        </Button>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Asset Hierarchy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-md hover:bg-gray-50 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </label>
                <p className="text-sm text-gray-500">
                  Upload your CSV file containing the asset hierarchy data
                </p>
              </div>
            </div>
            
            {uploadError && (
              <p className="text-red-500 text-sm whitespace-pre-line">{uploadError}</p>
            )}
            
            <div className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
                disabled={isUploading}
              >
                Download Template
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Download our CSV template to ensure your data is formatted correctly
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maintenance Plant</Label>
                <p className="text-sm">{selectedAsset.maintenancePlant}</p>
              </div>
              <div className="space-y-2">
                <Label>Internal ID</Label>
                <p className="text-sm">{selectedAsset.internalId}</p>
              </div>
              <div className="space-y-2">
                <Label>Functional Location</Label>
                <p className="text-sm">{selectedAsset.id}</p>
              </div>
              <div className="space-y-2">
                <Label>Parent</Label>
                <p className="text-sm">{selectedAsset.parent || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>Site Reference</Label>
                <p className="text-sm">{selectedAsset.siteReference}</p>
              </div>
              <div className="space-y-2">
                <Label>System Status</Label>
                <p className="text-sm">{selectedAsset.systemStatus}</p>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <p className="text-sm">{selectedAsset.name}</p>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Long Description</Label>
                <p className="text-sm">{selectedAsset.description}</p>
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <p className="text-sm">{selectedAsset.make || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <p className="text-sm">{selectedAsset.manufacturer || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <p className="text-sm">{selectedAsset.serialNumber || '-'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 text-[#2C3E50] font-medium">Asset</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Asset Description</th>
            </tr>
          </thead>
          <tbody>
            {renderAssets()}
          </tbody>
        </table>
      </div>
    </div>
  )
} 