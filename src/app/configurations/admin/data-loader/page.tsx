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
import { Upload, ChevronRight, ChevronDown } from "lucide-react"
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

const sampleCsvContent = `Maintenance Plant,Primary Key,CMMS Internal ID,Functional Location,Parent,CMMS System,Site Reference Name,Functional Location Description,Functional Location Long Description,Object Type (Taxonomy Mapping Value),System Status,Make,Manufacturer,Serial Number,Asset Description
AH_FLOC_MAINT_PLNT_C,AH_FLOC_PKEY,AH_FLOC_INTERNAL_ID_C,AH_FLOC_FNC_LOC_C,AH_FLOC_PARENT,AH_FLOC_SAP_SYSTEM_C,MI_SITE_NAME,AH_FLOC_FNC_LOC_DESC_C,AH_FLOC_FNC_LOC_LNG_DESC_C,AH_FLOC_OBJ_TYP_C,AH_FLOC_SYS_STATUS_C,,,,Description Field
Off-Site Support,,IID001,Cars,,SAP01,Salt Lake City UT,Car Fans,Car Fans Division,Equipment,Active,,,,Main Car Division
Off-Site Support,,IID002,Cars-Honda,Cars,SAP01,Salt Lake City UT,D-Dog Car,D-Dog Car Division,Equipment,Active,Honda,,,Honda Car Section
Off-Site Support,,IID003,Cars-Honda-Engine,Cars-Honda,SAP01,Salt Lake City UT,D-Dog Car Engine,D-Dog Car Engine System,Equipment,Active,Honda,,,Engine Component
Off-Site Support,,IID004,Cars-Honda-Trans,Cars-Honda,SAP01,Salt Lake City UT,D-Dog Car Trans,D-Dog Car Transmission,Equipment,Active,Honda,,,Transmission System
Off-Site Support,,IID005,Cars-Honda-Oil-Filter,Cars-Honda-Engine,SAP01,Salt Lake City UT,D-Dog Car Engine Oil Filter,D-Dog Car Engine Oil Filter Component,Equipment,Active,Honda,,,Oil Filter Component`

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
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

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
      console.log("Response:", response);
      
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

  const renderAssetRows = () => {
    const renderAssetRow = (asset: Asset, depth: number = 0) => {
      const isExpanded = expandedAssets.has(asset.id);
      const hasChildAssets = hasChildren(asset.id);
      const childAssets = assets.filter(a => a.parent === asset.id);
      const paddingLeft = depth * 24;

      return (
        <React.Fragment key={asset.id}>
          <tr className="border-b hover:bg-gray-50">
            <td className="p-4">
              <div style={{ paddingLeft: `${paddingLeft}px` }} className="flex items-center">
                {hasChildAssets && (
                  <button
                    onClick={() => toggleAsset(asset.id)}
                    className="mr-2 p-1 hover:bg-gray-200 rounded-md focus:outline-none"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                {!hasChildAssets && <span className="w-6" />}
                <span className="font-medium">{asset.id}</span>
              </div>
            </td>
            <td 
              className="p-4 cursor-pointer hover:text-blue-600"
              onClick={() => {
                setSelectedAsset(asset);
                setShowDetailsDialog(true);
              }}
            >
              <div className="flex flex-col">
                <span>{asset.description || asset.functionalLocationDesc || '-'}</span>
                <span className="text-sm text-gray-500">
                  {asset.parent ? `Parent: ${asset.parent}` : 'Root Asset'}
                </span>
              </div>
            </td>
          </tr>
          {isExpanded && childAssets.map(child => renderAssetRow(child, depth + 1))}
        </React.Fragment>
      );
    };

    const rootAssets = assets.filter(asset => !asset.parent);
    return rootAssets.map(asset => renderAssetRow(asset));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.cmmsInternalId.trim()) {
      toast({
        title: "Error",
        description: "CMMS Internal ID is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.functionalLocation.trim()) {
      toast({
        title: "Error",
        description: "Functional Location is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.functionalLocationDesc.trim()) {
      toast({
        title: "Error",
        description: "Functional Location Description is required",
        variant: "destructive",
      })
      return
    }

    try {
      const assetToCreate = {
        assets: [{
          ...formData,
          id: formData.functionalLocation,
          // Ensure required fields are never null
          cmmsInternalId: formData.cmmsInternalId.trim(),
          functionalLocation: formData.functionalLocation.trim(),
          functionalLocationDesc: formData.functionalLocationDesc.trim(),
          description: formData.description.trim() || formData.functionalLocationDesc.trim(), // Use functionalLocationDesc as fallback
          // Set default values for optional fields
          functionalLocationLongDesc: formData.functionalLocationLongDesc?.trim() || '',
          maintenancePlant: formData.maintenancePlant?.trim() || '',
          cmmsSystem: formData.cmmsSystem?.trim() || '',
          siteReferenceName: formData.siteReferenceName?.trim() || '',
          objectType: formData.objectType?.trim() || '',
          make: formData.make?.trim() || '',
          manufacturer: formData.manufacturer?.trim() || '',
          serialNumber: formData.serialNumber?.trim() || '',
          systemStatus: formData.systemStatus || 'Active'
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
      toast({
        title: "Error",
        description: "Failed to create asset. Please try again.",
        variant: "destructive",
      })
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
        <div className="flex gap-2">
          <Button 
            onClick={downloadTemplate}
            variant="outline" 
            className="border-[#00A3FF] text-[#00A3FF] hover:bg-[#00A3FF] hover:text-white"
          >
            Download Template
          </Button>
          <label>
            <Input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90">
              + Upload CSV
            </Button>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 text-[#2C3E50] font-medium">Asset ID</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Asset Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={2} className="text-center py-8">Loading assets...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={2} className="text-center py-8 text-red-500">{error}</td>
              </tr>
            ) : (
              renderAssetRows()
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        {selectedAsset && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Asset Details</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Asset ID</Label>
                <div className="mt-1 text-sm">{selectedAsset.id}</div>
              </div>
              <div>
                <Label>Name</Label>
                <div className="mt-1 text-sm">{selectedAsset.name}</div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="mt-1 text-sm">{selectedAsset.description || '-'}</div>
              </div>
              <div>
                <Label>CMMS Internal ID</Label>
                <div className="mt-1 text-sm">{selectedAsset.cmmsInternalId}</div>
              </div>
              <div>
                <Label>Maintenance Plant</Label>
                <div className="mt-1 text-sm">{selectedAsset.maintenancePlant || '-'}</div>
              </div>
              <div>
                <Label>CMMS System</Label>
                <div className="mt-1 text-sm">{selectedAsset.cmmsSystem || '-'}</div>
              </div>
              <div>
                <Label>Site Reference</Label>
                <div className="mt-1 text-sm">{selectedAsset.siteReferenceName || '-'}</div>
              </div>
              <div>
                <Label>Functional Location</Label>
                <div className="mt-1 text-sm">{selectedAsset.functionalLocation || '-'}</div>
              </div>
              <div>
                <Label>Functional Location Description</Label>
                <div className="mt-1 text-sm">{selectedAsset.functionalLocationDesc || '-'}</div>
              </div>
              <div>
                <Label>Object Type</Label>
                <div className="mt-1 text-sm">{selectedAsset.objectType || '-'}</div>
              </div>
              <div>
                <Label>System Status</Label>
                <div className="mt-1 text-sm">{selectedAsset.systemStatus}</div>
              </div>
              <div>
                <Label>Make</Label>
                <div className="mt-1 text-sm">{selectedAsset.make || '-'}</div>
              </div>
              <div>
                <Label>Manufacturer</Label>
                <div className="mt-1 text-sm">{selectedAsset.manufacturer || '-'}</div>
              </div>
              <div>
                <Label>Serial Number</Label>
                <div className="mt-1 text-sm">{selectedAsset.serialNumber || '-'}</div>
              </div>
              <div>
                <Label>Level</Label>
                <div className="mt-1 text-sm">{selectedAsset.level}</div>
              </div>
              <div>
                <Label>Parent</Label>
                <div className="mt-1 text-sm">{selectedAsset.parent || 'Root Asset'}</div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
} 