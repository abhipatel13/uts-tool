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
import { Plus, Upload, ChevronRight, ChevronDown } from "lucide-react"
import { assetHierarchyApi, Asset } from "@/services/assetHierarchyApi"
import { useToast } from "@/components/ui/use-toast"

const sampleCsvContent = `Asset ID,Asset Name,Description,Level,Parent ID,FMEA,Actions,Criticality Assessment,Inspection Points
V,VTA Maintenance,VTA Maintenance Division,0,,0,0,0,0
V1,VTA Overhaul and Repair Division,O&R Division,1,V,0,0,0,0
V1F,O&R Facilities,Facilities Management,2,V1,0,0,0,0
V1F-01,Facilities - Main Building (G),Main Building,3,V1F,0,0,0,0
V1F-01-01,Facilities - Plumbing,Plumbing Systems,4,V1F-01,0,0,0,0
V1F-01-02,Facilities - HVAC System,HVAC Systems,4,V1F-01,0,0,0,0`

export default function AssetHierarchy() {
  const { toast } = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Asset Hierarchy</h1>
          <p className="text-gray-600">Manage your asset hierarchy structure here.</p>
        </div>
        <div className="flex gap-4">
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