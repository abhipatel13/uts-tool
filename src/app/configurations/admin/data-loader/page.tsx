"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BackButton } from "@/components/ui/back-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { assetHierarchyApi } from "@/services/assetHierarchyApi"
import { useToast } from "@/components/ui/use-toast"

interface UploadStatus {
  id?: string;
  fileName: string;
  status: 'uploading' | 'completed' | 'error';
  uploadedBy?: string;
  uploadedAt?: string;
  fileSize?: number;
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadHistory, setUploadHistory] = useState<UploadStatus[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const fetchUploadHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true)
      const response = await assetHierarchyApi.getUploadHistory()
      console.log("response",response)
      if (response.status) {
        setUploadHistory(response.data)
      } else {
        throw new Error(response.message || 'Failed to fetch upload history')
      }
    } catch (error) {
      console.error('Error fetching upload history:', error)
      toast({
        title: "Error",
        description: "Failed to fetch upload history.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }, [toast])

  // Fetch upload history when component mounts
  useEffect(() => {
    fetchUploadHistory()
  }, [fetchUploadHistory])

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)
    const newUploadStatus = {
      fileName: file.name,
      status: 'uploading' as const
    }
    setUploadHistory(prev => [newUploadStatus, ...prev])

    try {
      const response = await assetHierarchyApi.uploadCSV(file)
      
      if (!response.data || !response.fileUpload) {
        throw new Error('Invalid response format from server')
      }

      const updatedStatus = {
        id: response.fileUpload.id,
        fileName: response.fileUpload.originalName,
        status: response.fileUpload.status,
        uploadedBy: response.fileUpload.uploadedBy
      }
      setUploadHistory(prev => [updatedStatus, ...prev.slice(1)])
      setShowUploadDialog(false)

      // Show success toast
      toast({
        title: "Success!",
        description: "File uploaded successfully.",
        variant: "default",
      })

      // Refresh upload history
      fetchUploadHistory()
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadError('Failed to upload file. Please try again.')
      const failedStatus = {
        fileName: file.name,
        status: 'error' as const
      }
      setUploadHistory(prev => [failedStatus, ...prev.slice(1)])
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Data Loader</h1>
          <p className="text-gray-600">Upload and manage your asset hierarchy data.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={downloadTemplate}
            variant="outline" 
            className="border-[rgb(52_73_94_/_1)] text-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)] hover:text-white"
          >
            Download Template
          </Button>
          <Button 
            onClick={() => setShowUploadDialog(true)}
            className="bg-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)]"
          >
            + Upload CSV
          </Button>
        </div>
      </div>

      {/* File Upload History */}
      <div className="mb-6">
        <div className="space-y-3">
          {isLoadingHistory ? (
            <div className="text-center py-4 text-gray-500">
              Loading upload history...
            </div>
          ) : uploadHistory.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No files have been uploaded yet
            </div>
          ) : (
            uploadHistory.map((upload, index) => (
              <div key={upload.id || index} className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{upload.fileName}</span>
                      <span className="text-sm text-gray-500">
                        {upload.uploadedBy ? `Uploaded by ${upload.uploadedBy}` : 'Uploading...'}
                        {upload.uploadedAt && ` • ${new Date(upload.uploadedAt).toLocaleDateString()}`}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      upload.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                      upload.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {upload.status === 'uploading' ? 'Uploading...' :
                       upload.status === 'completed' ? 'Completed' :
                       'Upload Failed'}
                    </span>
                  </div>
                  {upload.fileSize && (
                    <span className="text-sm text-gray-500">
                      {(upload.fileSize / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload CSV File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select CSV File</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>
            </div>
            {uploadError && (
              <div className="text-red-500 text-sm">{uploadError}</div>
            )}
            <div className="text-sm text-gray-500">
              <p>Please ensure your CSV file follows the required format.</p>
              <p>You can download the template for reference.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 