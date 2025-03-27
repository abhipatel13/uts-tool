"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, ChevronRight, ChevronDown, Plus } from "lucide-react"
import { assetHierarchyApi } from "@/services/assetHierarchyApi"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Asset {
  id: string;
  name: string;
  description: string;
  level: number;
  fmea: string;
  actions: string;
  criticalityAssessment: string;
  inspectionPoints: string;
  maintenancePlant: string;
  cmmsInternalId: string;
  functionalLocation: string;
  parent: string | null;
  cmmsSystem: string;
  siteReferenceName: string;
  functionalLocationDesc: string;
  functionalLocationLongDesc: string;
  objectType?: string;
  systemStatus: string;
  make?: string;
  manufacturer?: string;
  serialNumber?: string;
  primaryKey?: string;
}

const sampleCsvContent = `Asset ID,Asset Name,Description,Level,Parent ID,FMEA,Actions,Criticality Assessment,Inspection Points
V,VTA Maintenance,VTA Maintenance Division,0,,0,0,0,0
V1,VTA Overhaul and Repair Division,O&R Division,1,V,0,0,0,0
V1F,O&R Facilities,Facilities Management,2,V1,0,0,0,0
V1F-01,Facilities - Main Building (G),Main Building,3,V1F,0,0,0,0
V1F-01-01,Facilities - Plumbing,Plumbing Systems,4,V1F-01,0,0,0,0
V1F-01-02,Facilities - HVAC System,HVAC Systems,4,V1F-01,0,0,0,0`

export default function DataLoader() {
  const { toast } = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    level: 0,
    fmea: '',
    actions: '',
    criticalityAssessment: '',
    inspectionPoints: '',
    maintenancePlant: '',
    cmmsInternalId: '',
    functionalLocation: '',
    parent: null,
    cmmsSystem: '',
    siteReferenceName: '',
    functionalLocationDesc: '',
    functionalLocationLongDesc: '',
    objectType: '',
    systemStatus: 'Active',
    make: '',
    manufacturer: '',
    serialNumber: ''
  })
  const [showAddDialog, setShowAddDialog] = useState(false)

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

      setAssets(response.data)
      
      // Expand root level assets by default
      const rootAssets = new Set(
        response.data
          .filter((asset: Asset) => asset.level === 0)
          .map((asset: Asset) => asset.id)
      ) as Set<string>
      setExpandedAssets(rootAssets)
    } catch (err) {
      console.error('Error fetching assets:', err)
      setError('Failed to load assets. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log("File:", file);
    if (!file) return

    setUploadError(null)

    try {
      const response = await assetHierarchyApi.uploadCSV(file)
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from server')
      }

      setAssets(response.data)
      
      // Expand root level assets by default
      const rootAssets = new Set(
        response.data
          .filter((a) => a.level === 0)
          .map((a) => a.id)
      ) as Set<string>
      setExpandedAssets(rootAssets)
      setShowUploadDialog(false)

      // Show success toast
      toast({
        title: "Success!",
        description: `Successfully uploaded ${response.data.length} assets.`,
        variant: "default",
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadError('Failed to upload file. Please try again.')
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
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

  const renderAssets = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={6} className="text-center py-8">
            Loading assets...
          </td>
        </tr>
      )
    }

    if (error) {
      return (
        <tr>
          <td colSpan={6} className="text-center py-8 text-red-500">
            {error}
          </td>
        </tr>
      )
    }

    if (assets.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="text-center py-8 text-gray-500">
            No assets found. Import a CSV file or add assets manually.
          </td>
        </tr>
      )
    }

    const visibleAssets = assets.filter(asset => {
      if (asset.level === 0) return true
      
      // Check if all parent assets are expanded
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
              <span className="w-6" /> // Spacer for alignment
            )}
            <span>{asset.name}</span>
          </div>
        </td>
        <td className="p-4">{asset.description}</td>
        <td className="text-center p-4">{asset.fmea}</td>
        <td className="text-center p-4">{asset.actions}</td>
        <td className="text-center p-4">{asset.criticalityAssessment}</td>
        <td className="text-center p-4">{asset.inspectionPoints}</td>
      </tr>
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const assetToCreate = {
        assets: [{
          ...formData,
          id: formData.functionalLocation
        }]
      }
      await assetHierarchyApi.create(assetToCreate)
      setShowAddDialog(false)
      fetchAssets()
      toast({
        title: "Success!",
        description: "Asset added successfully.",
        variant: "default",
      })
      // Reset form
      setFormData({
        name: '',
        description: '',
        level: 0,
        fmea: '',
        actions: '',
        criticalityAssessment: '',
        inspectionPoints: '',
        maintenancePlant: '',
        cmmsInternalId: '',
        functionalLocation: '',
        parent: null,
        cmmsSystem: '',
        siteReferenceName: '',
        functionalLocationDesc: '',
        functionalLocationLongDesc: '',
        objectType: '',
        systemStatus: 'Active',
        make: '',
        manufacturer: '',
        serialNumber: ''
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      setError('Failed to submit form. Please try again later.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Data Loader</h1>
          <p className="text-gray-600">Manage your asset hierarchy structure here.</p>
        </div>
        <div className="flex gap-4">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 gap-2">
                <Plus className="h-4 w-4" /> Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maintenance Plant</Label>
                    <Input
                      name="maintenancePlant"
                      value={formData.maintenancePlant}
                      onChange={handleInputChange}
                      placeholder="e.g., Off-Site Support"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CMMS Internal ID</Label>
                    <Input
                      name="cmmsInternalId"
                      value={formData.cmmsInternalId}
                      onChange={handleInputChange}
                      placeholder="e.g., IID001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Functional Location</Label>
                    <Input
                      name="functionalLocation"
                      value={formData.functionalLocation}
                      onChange={handleInputChange}
                      placeholder="e.g., Cars"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent</Label>
                    <Select
                      value={formData.parent || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, parent: value === 'None' ? null : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        {assets.map(asset => (
                          <SelectItem key={asset.functionalLocation} value={asset.functionalLocation}>
                            {asset.functionalLocation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>CMMS System</Label>
                    <Input
                      name="cmmsSystem"
                      value={formData.cmmsSystem}
                      onChange={handleInputChange}
                      placeholder="e.g., Salt Lake City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Site Reference Name</Label>
                    <Input
                      name="siteReferenceName"
                      value={formData.siteReferenceName}
                      onChange={handleInputChange}
                      placeholder="e.g., Salt Lake City, UT"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      name="functionalLocationDesc"
                      value={formData.functionalLocationDesc}
                      onChange={handleInputChange}
                      placeholder="Short description"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Long Description</Label>
                    <Input
                      name="functionalLocationLongDesc"
                      value={formData.functionalLocationLongDesc}
                      onChange={handleInputChange}
                      placeholder="Detailed description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Object Type</Label>
                    <Input
                      name="objectType"
                      value={formData.objectType}
                      onChange={handleInputChange}
                      placeholder="e.g., Equipment"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>System Status</Label>
                    <Select
                      value={formData.systemStatus}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, systemStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Input
                      name="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      placeholder="Make"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Manufacturer</Label>
                    <Input
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleInputChange}
                      placeholder="Manufacturer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleInputChange}
                      placeholder="Serial Number"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Asset</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 gap-2">
                <Upload className="h-4 w-4" /> Import CSV
              </Button>
            </DialogTrigger>
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
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-md hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </label>
                    <p className="text-sm text-gray-500">
                      Upload your CSV file containing the asset hierarchy data
                    </p>
                  </div>
                </div>
                {uploadError && (
                  <p className="text-red-500 text-sm">{uploadError}</p>
                )}
                <div className="border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                    className="w-full"
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
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 text-[#2C3E50] font-medium">Asset</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Asset Description</th>
              <th className="text-center p-4 text-[#2C3E50] font-medium">FMEA</th>
              <th className="text-center p-4 text-[#2C3E50] font-medium">ACTIONS</th>
              <th className="text-center p-4 text-[#2C3E50] font-medium">Criticality Assessment</th>
              <th className="text-center p-4 text-[#2C3E50] font-medium">Inspection Points</th>
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