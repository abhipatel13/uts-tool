"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AssetHierarchyApi } from "@/services"
import { useToast } from "@/components/ui/use-toast"
import { UploadStatus } from '@/types'
import { Info, Download, FileDown, Database } from 'lucide-react'

const sampleCsvContent = `id,name,cmms_internal_id,functional_location,functional_location_desc,functional_location_long_desc,parent_id,maintenance_plant,cmms_system,object_type,system_status,make,manufacturer,serial_number
SAP001-1751172747697,Conveyor System,SAP001,Mine 2,Gold mine in Arizona,Large gold mining operation in Arizona,,Maintenance plant 1,SAP,Heavy machinery,Active,Conveyor System Model 4464,Fenner Dunlop,JKCFQSHEAQZD
SAP002-1751279615792,Roller,SAP002,Mine 2,Gold mine in Arizona,Large gold mining operation in Arizona,SAP001-1751172747697,Maintenance plant 1,SAP,Heavy machinery accessory,Active,Roller Model 4289,Industrial Co,QMO1NJOHVEPK
SAP003-1750487080996,Conveyor System,SAP003,Mine 3,Coal mine in Wyoming,Surface coal mining facility in Wyoming,,Maintenance plant 1,SAP,Heavy machinery,Active,Conveyor System Model 5914,Continental,IQFEA88HRO2B
SAP004-1750640735176,Belt,SAP004,Mine 3,Coal mine in Wyoming,Surface coal mining facility in Wyoming,SAP003-1750487080996,Maintenance plant 1,SAP,Heavy machinery accessory,Active,Belt Model 8137,Industrial Co,3D4KJMY2G2ZZ
MAX001-1750499632690,Generator,MAX001,Mine 1,Copper mine site in Utah,A copper mining operation in Utah,,Central Maintenance,Maximo,Heavy machinery,Active,Generator Model 9102,Kohler,KR78W3EZ8S44
MAX002-1750896497470,Alternator,MAX002,Mine 1,Copper mine site in Utah,A copper mining operation in Utah,MAX001-1750499632690,Central Maintenance,Maximo,Heavy machinery accessory,Active,Alternator Model 9096,Industrial Co,I2X3RTOYZBB3
MAX003-1750519533565,Control Panel,MAX003,Mine 1,Copper mine site in Utah,A copper mining operation in Utah,MAX001-1750499632690,Central Maintenance,Maximo,Heavy machinery accessory,Active,Control Panel Model 7702,Industrial Co,ZOFG9DE7CS7D
SAP005-1750543166048,Generator,SAP005,Processing Plant A,Ore processing facility,Primary ore processing and refining facility,,Maintenance plant 1,SAP,Heavy machinery,Active,Generator Model 6877,Caterpillar,9YYZDA7DC0I3
SAP006-1750839830312,Alternator,SAP006,Processing Plant A,Ore processing facility,Primary ore processing and refining facility,SAP005-1750543166048,Maintenance plant 1,SAP,Heavy machinery accessory,Active,Alternator Model 8399,Equipment Ltd,DRX7HJIN3UQ3
SAP007-1750641268781,Engine,SAP007,Processing Plant A,Ore processing facility,Primary ore processing and refining facility,SAP005-1750543166048,Maintenance plant 1,SAP,Heavy machinery accessory,Active,QSK60,Equipment Ltd,AVWLW1WURXT2
SAP008-1751036319276,Excavator,SAP008,Mine 1,Copper mine site in Utah,A copper mining operation in Utah,,Central Maintenance,SAP,Heavy machinery,Active,PC8000-6,Volvo,ETZ7R1A73W8C
SAP009-1751397117819,Loading Shovel,SAP009,Mine 1,Copper mine site in Utah,A copper mining operation in Utah,SAP008-1751036319276,Central Maintenance,SAP,Heavy machinery accessory,Active,Loading Shovel Model 8708,Industrial Co,CBDNB8BLQI80`

export default function DataLoader() {
  const { toast } = useToast()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [uploadHistory, setUploadHistory] = useState<UploadStatus[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [activePolling, setActivePolling] = useState<Set<string>>(new Set())
  const hasStartedInitialPolling = useRef(false)

  const fetchUploadHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true)
      const response = await AssetHierarchyApi.getUploadHistory()
      if (response.status) {
        setUploadHistory(response.data)
      } else {
        throw new Error(response.message || 'Failed to fetch upload history')
      }
    } catch (error) {
      console.error('Error fetching upload history:', error)
      
      let errorMessage = 'Failed to fetch upload history.'
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('Not Found'))) {
        errorMessage = 'Upload history API not implemented yet.'
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }, [toast])

  // Poll for upload status updates
  const pollUploadStatus = useCallback(async (uploadId: string) => {
    if (!uploadId || uploadId.trim() === '') {
      console.error('Invalid uploadId provided to pollUploadStatus:', uploadId);
      return;
    }
    
    if (activePolling.has(uploadId)) return; // Already polling this upload
    
    const newActivePolling = new Set(activePolling)
    newActivePolling.add(uploadId)
    setActivePolling(newActivePolling)

    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await AssetHierarchyApi.getUploadStatus(uploadId)
        if (statusResponse.status) {
          const uploadStatus = statusResponse.data
          
          // Update the upload in the history
          setUploadHistory(prev => prev.map(upload => 
            (upload.uploadId === uploadId || upload.id === uploadId) 
              ? { ...upload, ...uploadStatus }
              : upload
          ))

          // Check if upload is complete
          if (uploadStatus.status === 'completed') {
            clearInterval(pollInterval)
            const updatedActivePolling = new Set(activePolling)
            updatedActivePolling.delete(uploadId)
            setActivePolling(updatedActivePolling)
            
            toast({
              title: "Success!",
              description: "File processing completed successfully.",
              variant: "default",
            })
            
            // Refresh upload history to get the latest data
            fetchUploadHistory()
          } else if (uploadStatus.status === 'error') {
            clearInterval(pollInterval)
            const updatedActivePolling = new Set(activePolling)
            updatedActivePolling.delete(uploadId)
            setActivePolling(updatedActivePolling)
            
            toast({
              title: "Error",
              description: uploadStatus.errorMessage || "File processing failed.",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error('Error polling upload status for uploadId:', uploadId, error)
        
        // If it's an invalid uploadId error, stop polling and show error
        if (error instanceof Error && error.message.includes('Invalid uploadId parameter')) {
          console.error('Invalid uploadId detected, stopping polling');
          clearInterval(pollInterval)
          const updatedActivePolling = new Set(activePolling)
          updatedActivePolling.delete(uploadId)
          setActivePolling(updatedActivePolling)
          
          toast({
            title: "Error",
            description: "Invalid upload ID. Please refresh the page and try again.",
            variant: "destructive",
          })
        } else {
          // For other errors, continue polling but log the error
          console.warn('Polling error, will retry:', error);
        }
      }
    }, 2000) // Poll every 2 seconds

    // Clear polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval)
      const updatedActivePolling = new Set(activePolling)
      updatedActivePolling.delete(uploadId)
      setActivePolling(updatedActivePolling)
    }, 5 * 60 * 1000) // 5 minutes
  }, [activePolling, toast, fetchUploadHistory])

  // Fetch upload history when component mounts
  useEffect(() => {
    fetchUploadHistory()
  }, [fetchUploadHistory])

  // Start polling for any in-progress uploads when component mounts
  useEffect(() => {
    if (!hasStartedInitialPolling.current && uploadHistory.length > 0 && !isLoadingHistory) {
      hasStartedInitialPolling.current = true
      uploadHistory.forEach(upload => {
        if ((upload.status === 'uploading' || upload.status === 'processing') && 
            (upload.uploadId || upload.id)) {
          const idToTrack = upload.uploadId || upload.id!
          pollUploadStatus(idToTrack)
        }
      })
    }
  }, [uploadHistory, isLoadingHistory, pollUploadStatus]) // Run when data is available

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      // Clear all active polling when component unmounts
      setActivePolling(new Set())
    }
  }, [])

  const downloadSampleTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'asset-hierarchy-sample-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const downloadEmptyTemplate = () => {
    const headers = 'id,name,cmms_internal_id,functional_location,functional_location_desc,functional_location_long_desc,parent_id,maintenance_plant,cmms_system,object_type,system_status,make,manufacturer,serial_number'
    const blob = new Blob([headers], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'asset-hierarchy-empty-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const downloadCurrentAssets = async () => {
    try {
      const response = await AssetHierarchyApi.getAll()
      if (!response.status || !response.data) {
        throw new Error(response.message || 'Failed to fetch current assets')
      }

      const assets = response.data
      if (assets.length === 0) {
        toast({
          title: "No Assets Found",
          description: "There are no assets in your company's hierarchy to export.",
          variant: "default",
        })
        return
      }

      // Convert assets to CSV format
      const headers = 'id,name,cmms_internal_id,functional_location,functional_location_desc,functional_location_long_desc,parent_id,maintenance_plant,cmms_system,object_type,system_status,make,manufacturer,serial_number'
      
      const csvRows = assets.map(asset => {
        // Escape values that contain commas or quotes
        const escapeValue = (value: unknown) => {
          if (value === null || value === undefined) return ''
          const str = String(value)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }

        return [
          escapeValue(asset.id),
          escapeValue(asset.name),
          escapeValue(asset.cmmsInternalId),
          escapeValue(asset.functionalLocation),
          escapeValue(asset.functionalLocationDesc),
          escapeValue(asset.functionalLocationLongDesc),
          escapeValue(asset.parent),
          escapeValue(asset.maintenancePlant),
          escapeValue(asset.cmmsSystem),
          escapeValue(asset.objectType),
          escapeValue(asset.systemStatus),
          escapeValue(asset.make),
          escapeValue(asset.manufacturer),
          escapeValue(asset.serialNumber)
        ].join(',')
      })

      const csvContent = [headers, ...csvRows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      link.download = `asset-hierarchy-backup-${timestamp}.csv`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `Exported ${assets.length} assets to CSV file.`,
        variant: "default",
      })

    } catch (error) {
      console.error('Error downloading current assets:', error)
      
      let errorMessage = 'Failed to export current assets.'
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'Asset hierarchy API not available. Please contact your administrator.'
        } else if (error.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your internet connection.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)
    const tempUploadStatus = {
      fileName: file.name,
      status: 'uploading' as const,
      message: 'Uploading file...'
    }
    setUploadHistory(prev => [tempUploadStatus, ...prev])

    try {
      const response = await AssetHierarchyApi.uploadCSV(file)
      
      console.log('Upload response received:', response)
      
      // Handle both possible response formats
      const isSuccess = response.status === true || ('success' in response && (response as { success: boolean }).success === true)
      if (!isSuccess || !response.data) {
        console.error('Upload failed. Response:', response)
        throw new Error(response.message || 'Invalid response format from server')
      }

      const uploadData = response.data
      console.log('Upload data:', uploadData)
      const updatedStatus = {
        id: uploadData.id,
        uploadId: uploadData.uploadId,
        fileName: uploadData.fileName,
        status: uploadData.status,
        message: uploadData.message,
        uploadedBy: uploadData.uploadedBy
      }
      
      setUploadHistory(prev => [updatedStatus, ...prev.slice(1)])
      setShowUploadDialog(false)

      // Show initial success toast
      toast({
        title: "Upload Started!",
        description: uploadData.message || "Your CSV file is being processed in the background...",
        variant: "default",
      })

      // Start polling for status updates if we have an uploadId
      const idToTrack = uploadData.uploadId || uploadData.id
      console.log('Upload data received:', uploadData);
      console.log('ID to track:', idToTrack);
      
      if (idToTrack && idToTrack.trim() !== '') {
        pollUploadStatus(idToTrack)
      } else {
        console.error('No valid uploadId found in response:', uploadData);
      }

      // Clear the file input
      event.target.value = ''
    } catch (error) {
      console.error('Error uploading file:', error)
      
      // Check if it's a 404 error (API endpoint doesn't exist)
      let errorMessage = 'Failed to upload file. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'API endpoint not implemented yet. Please contact your administrator.'
        } else if (error.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your internet connection.'
        } else {
          errorMessage = error.message
        }
      }
      
      setUploadError(errorMessage)
      const failedStatus = {
        fileName: file.name,
        status: 'error' as const,
        errorMessage: errorMessage
      }
      setUploadHistory(prev => [failedStatus, ...prev.slice(1)])
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      // Clear the file input
      event.target.value = ''
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Data Loader</h1>
          <p className="text-gray-600">Upload and manage your asset hierarchy data.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowInfoDialog(true)}
            variant="outline" 
            className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
          >
            <Info className="w-4 h-4 mr-2" />
            Upload Requirements
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="border-[rgb(52_73_94_/_1)] text-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)] hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={downloadSampleTemplate}>
                <FileDown className="w-4 h-4 mr-2" />
                Sample Template
                <span className="ml-auto text-xs text-gray-500">With data</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadEmptyTemplate}>
                <FileDown className="w-4 h-4 mr-2" />
                Empty Template
                <span className="ml-auto text-xs text-gray-500">Headers only</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadCurrentAssets}>
                <Database className="w-4 h-4 mr-2" />
                Current Assets
                <span className="ml-auto text-xs text-gray-500">Backup</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
                      <div className="text-sm text-gray-500">
                        {upload.uploadedBy ? `Uploaded by ${upload.uploadedBy}` : 'Uploading...'}
                        {upload.uploadedAt && ` • ${new Date(upload.uploadedAt).toLocaleDateString()}`}
                        {upload.updatedAt && upload.uploadedAt !== upload.updatedAt && 
                          ` • Updated ${new Date(upload.updatedAt).toLocaleDateString()}`}
                      </div>
                      {upload.message && (
                        <div className="text-sm text-gray-600 mt-1">
                          {upload.message}
                        </div>
                      )}
                      {upload.errorMessage && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {upload.errorMessage}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm whitespace-nowrap ${
                      upload.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                      upload.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      upload.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {upload.status === 'uploading' ? 'Uploading...' :
                       upload.status === 'processing' ? 'Processing...' :
                       upload.status === 'completed' ? 'Completed' :
                       'Failed'}
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
              <p>Use the &ldquo;Download Options&rdquo; button to get templates or backup your current data.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Information Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2C3E50]">
              Asset Hierarchy CSV Upload Requirements
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            
            {/* Required Information */}
            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">📋 Required Information</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Essential Fields</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li><strong>name</strong> - Asset name (required for every row)</li>
                </ul>
              </div>
            </div>

            {/* ID Strategy */}
            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">🔑 ID Strategy (Fallback Hierarchy)</h3>
              <p className="text-gray-600 mb-3">The system automatically determines which field to use as the unique identifier using this <strong>fallback hierarchy</strong>:</p>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">📋 How It Works:</h4>
                <p className="text-blue-700 text-sm">You can include multiple ID fields in your CSV, but the system will automatically choose which one to use based on the rules below.</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 relative">
                  <div className="absolute -left-2 -top-2 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                  <h4 className="font-medium text-green-800 mb-2 ml-4">Primary: &lsquo;id&rsquo; column</h4>
                  <div className="ml-4 text-green-700">
                    <p className="mb-2"><strong>If ANY row has an &lsquo;id&rsquo; value:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>ALL rows must have a unique, non-empty <code className="bg-green-100 px-1 rounded">id</code> value</li>
                      <li>The <code className="bg-green-100 px-1 rounded">id</code> column will be used as the primary identifier</li>
                      <li>Other ID fields (cmms_internal_id, functional_location) can be present but won&rsquo;t be used for identification</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 relative">
                  <div className="absolute -left-2 -top-2 bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                  <h4 className="font-medium text-yellow-800 mb-2 ml-4">Fallback: &lsquo;cmms_internal_id&rsquo;</h4>
                  <div className="ml-4 text-yellow-700">
                    <p className="mb-2"><strong>If NO rows have &lsquo;id&rsquo; values:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Every row must have a unique, non-empty <code className="bg-yellow-100 px-1 rounded">cmms_internal_id</code> value</li>
                      <li>If any row is missing <code className="bg-yellow-100 px-1 rounded">cmms_internal_id</code> or values aren&rsquo;t unique → Falls back to step 3</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 relative">
                  <div className="absolute -left-2 -top-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                  <h4 className="font-medium text-purple-800 mb-2 ml-4">Final Fallback: &lsquo;functional_location&rsquo;</h4>
                  <div className="ml-4 text-purple-700">
                    <p className="mb-2"><strong>If cmms_internal_id fails:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Every row must have a unique, non-empty <code className="bg-purple-100 px-1 rounded">functional_location</code> value</li>
                      <li>If any row is missing <code className="bg-purple-100 px-1 rounded">functional_location</code> or values aren&rsquo;t unique → <strong className="text-red-600">Upload fails</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Relationships */}
            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">🔗 Parent Relationships</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">parent_id Column (Optional)</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Can reference either an <strong>asset ID</strong> or <strong>asset name</strong></li>
                  <li>All referenced parents must exist in the same CSV file</li>
                  <li>If using asset names and there are duplicates, the <strong>last occurrence</strong> will be used</li>
                  <li><strong>No circular relationships allowed</strong> (Asset A cannot be parent of Asset B if Asset B is an ancestor of Asset A)</li>
                </ul>
              </div>
            </div>

            {/* Auto-Filled Fields */}
            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">⚡ Auto-Filled Fields</h3>
              <p className="text-gray-600 mb-3">These fields will be automatically populated if missing:</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li><strong>functional_location_desc</strong> → Uses <code className="bg-green-100 px-1 rounded">name</code> if not provided</li>
                  <li><strong>cmms_internal_id</strong> → Uses the chosen ID field if not provided</li>
                  <li><strong>functional_location</strong> → Uses the chosen ID field if not provided</li>
                </ul>
              </div>
            </div>

            {/* Optional Fields */}
            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">📝 Optional Fields</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>description</li>
                    <li>functional_location_long_desc</li>
                    <li>maintenance_plant (defaults to &ldquo;Default Plant&rdquo;)</li>
                    <li>cmms_system (defaults to &ldquo;Default System&rdquo;)</li>
                  </ul>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>object_type (defaults to &ldquo;Equipment&rdquo;)</li>
                    <li>system_status (defaults to &ldquo;Active&rdquo;)</li>
                    <li>make</li>
                    <li>manufacturer</li>
                    <li>serial_number</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Validation Examples */}
            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">✅❌ Validation Examples</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">✅ Valid Examples</h4>
                  <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                    <li>All rows have unique values in <code className="bg-green-100 px-1 rounded">id</code> column (preferred)</li>
                    <li>No <code className="bg-green-100 px-1 rounded">id</code> column, but all rows have unique <code className="bg-green-100 px-1 rounded">cmms_internal_id</code></li>
                    <li>No <code className="bg-green-100 px-1 rounded">id</code> or <code className="bg-green-100 px-1 rounded">cmms_internal_id</code>, but all rows have unique <code className="bg-green-100 px-1 rounded">functional_location</code></li>
                    <li>CSV with <code className="bg-green-100 px-1 rounded">id</code>, <code className="bg-green-100 px-1 rounded">cmms_internal_id</code>, AND <code className="bg-green-100 px-1 rounded">functional_location</code> (system uses <code className="bg-green-100 px-1 rounded">id</code>)</li>
                    <li>Parent references like &ldquo;Building A&rdquo; that match an asset name in the CSV</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">❌ Invalid Examples</h4>
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li>Missing <code className="bg-red-100 px-1 rounded">name</code> in any row</li>
                    <li>Some rows have <code className="bg-red-100 px-1 rounded">id</code> but others have empty/missing <code className="bg-red-100 px-1 rounded">id</code></li>
                    <li>No <code className="bg-red-100 px-1 rounded">id</code> column, but <code className="bg-red-100 px-1 rounded">cmms_internal_id</code> values aren&rsquo;t unique</li>
                    <li>All identifier fields (id, cmms_internal_id, functional_location) are missing or invalid</li>
                    <li>Parent reference &ldquo;Building B&rdquo; when no asset named &ldquo;Building B&rdquo; exists in CSV</li>
                    <li>Circular relationship: Asset A → Asset B → Asset C → Asset A</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">📥 Download Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <FileDown className="w-4 h-4 mr-2" />
                    Sample Template
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Download a CSV file with sample data to see the correct format and structure.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center">
                    <FileDown className="w-4 h-4 mr-2" />
                    Empty Template
                  </h4>
                  <p className="text-green-700 text-sm">
                    Download a CSV file with just the column headers, ready for you to add your data.
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2 flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Current Assets
                  </h4>
                  <p className="text-orange-700 text-sm">
                    Export your company&rsquo;s current asset hierarchy as a CSV backup file.
                  </p>
                </div>
              </div>
            </div>

            {/* File Format */}
            <div>
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">📄 File Format Requirements</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <ul className="list-disc list-inside text-purple-700 space-y-1">
                  <li><strong>CSV format</strong> with column headers</li>
                  <li><strong>UTF-8 encoding</strong> recommended</li>
                  <li>Empty rows are automatically skipped</li>
                </ul>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 