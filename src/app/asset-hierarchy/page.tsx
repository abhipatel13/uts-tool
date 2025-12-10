"use client"

import React, { useState, useEffect } from 'react'
import { CommonButton } from "@/components/ui/common-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, ChevronRight, ChevronDown, Info, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssetHierarchyApi } from "@/services"
import { hasPermission } from "@/utils/auth"
import { useToast } from "@/components/ui/use-toast"
import { ApiError } from "@/lib/api-client"
import { AssetSelector } from "@/components/AssetSelector"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Asset } from "@/types"
import { CreateAssetRequest } from "@/services/assetHierarchyApi"

export default function DataLoader() {
  const { toast } = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<CreateAssetRequest>({
    cmmsInternalId: '',
    name: '',
    description: '',
    functionalLocation: '',
    functionalLocationDesc: '',
    functionalLocationLongDesc: '',
    parent: null,
    maintenancePlant: '',
    cmmsSystem: '',
    objectType: '',
    systemStatus: 'Active',
    make: '',
    manufacturer: '',
    serialNumber: ''
  })
  const [showAutoFillDialog, setShowAutoFillDialog] = useState(false)
  const [autoFillParent, setAutoFillParent] = useState<Asset | null>(null)
  // Check if user has permission to create assets
  const canCreateAssets = hasPermission("create_asset_hierarchy");
  const canViewAssets = hasPermission("view_asset_hierarchy") || canCreateAssets;

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
    fetchAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await AssetHierarchyApi.getAll()
      const apiAssets = response.data as Asset[]
      
      if (!Array.isArray(apiAssets)) {
        throw new Error('Invalid response format from server')
      }

      setAssets(apiAssets)
      
      // Set expanded assets only on initial load, not on refresh
      if (mounted && expandedAssets.size === 0) {
        const rootAssets = new Set(
          apiAssets
            .filter(asset => !asset.parent)
            .map(asset => asset.id)
        )
        setExpandedAssets(rootAssets)
      }
    } catch (err) {
      console.error('Error fetching assets:', err)
      setError('Failed to load assets. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAssetsWithPreservedState = async (preservedExpanded: Set<string>) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await AssetHierarchyApi.getAll()
      const apiAssets = response.data as Asset[]
      
      if (!Array.isArray(apiAssets)) {
        throw new Error('Invalid response format from server')
      }

      setAssets(apiAssets)
      
      // Preserve the provided expansion state
      setExpandedAssets(preservedExpanded)
    } catch (err) {
      console.error('Error fetching assets:', err)
      setError('Failed to load assets. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleParentChange = (assetId: string) => {
    const parentAsset = assets.find(asset => asset.id === assetId)
    if (parentAsset) {
      setAutoFillParent(parentAsset)
      setShowAutoFillDialog(true)
    }
    setFormData(prev => ({
      ...prev,
      parent: assetId || null
    }))
  }

  const handleAutoFillParent = (parent: Asset) => {
    setFormData(prev => ({
      ...prev,
      maintenancePlant: parent.maintenancePlant || '',
      cmmsSystem: parent.cmmsSystem || '',
      make: parent.make || '',
      manufacturer: parent.manufacturer || ''
    }))
    setAutoFillParent(null)
    setShowAutoFillDialog(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const assetToCreate = {
        assets: [{
          ...formData,
          parent: formData.parent === '' ? null : formData.parent,
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          functionalLocation: formData.functionalLocation?.trim() || '',
          functionalLocationDesc: formData.functionalLocationDesc?.trim() || '',
          functionalLocationLongDesc: formData.functionalLocationLongDesc?.trim() || '',
          cmmsInternalId: formData.cmmsInternalId.trim(),
          maintenancePlant: formData.maintenancePlant?.trim() || '',
          cmmsSystem: formData.cmmsSystem?.trim() || '',
          objectType: formData.objectType?.trim() || '',
          systemStatus: formData.systemStatus || 'Active',
          make: formData.make?.trim() || '',
          manufacturer: formData.manufacturer?.trim() || '',
          serialNumber: formData.serialNumber?.trim() || ''
        }]
      }
      await AssetHierarchyApi.create(assetToCreate)
      setShowAddDialog(false)
      
      // Preserve current expansion state and only expand parent if needed
      const currentExpanded = new Set(expandedAssets)
      if (formData.parent) {
        currentExpanded.add(formData.parent)
      }
      
      // Fetch assets and preserve expansion state
      await fetchAssetsWithPreservedState(currentExpanded)
      
      toast({
        title: "Success!",
        description: "Asset added successfully.",
        variant: "default",
      })
      // Reset form
      setFormData({
        cmmsInternalId: '',
        name: '',
        description: '',
        functionalLocation: '',
        functionalLocationDesc: '',
        functionalLocationLongDesc: '',
        parent: null,
        maintenancePlant: '',
        cmmsSystem: '',
        objectType: '',
        systemStatus: 'Active',
        make: '',
        manufacturer: '',
        serialNumber: ''
      })
    } catch (error) {
      console.error('Error adding asset:', error)
      toast({
        title: "Error",
        description: "Failed to add asset. Please try again.",
        variant: "destructive",
      })
    }
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

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDetailsDialog(true);
  };

  const openDeleteDialog = (asset: Asset, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent triggering the asset click event
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await AssetHierarchyApi.deleteAssetUniversal(assetToDelete.id.toString());
      
      // Check if the response indicates success
      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Asset deleted successfully",
          variant: "default",
        });
        
        // Refresh the assets list and preserve expansion state
        const currentExpanded = new Set(expandedAssets);
        await fetchAssetsWithPreservedState(currentExpanded);
        
        // Close dialog and reset state
        setDeleteDialogOpen(false);
        setAssetToDelete(null);
      } else {
        // Handle API response with status: false
        toast({
          title: "Error",
          description: response.message || "Failed to delete asset",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      
      // Handle different error types based on status code
      let errorTitle = "Error";
      let errorDescription = "Failed to delete asset";
      
      if (error instanceof ApiError) {
        switch (error.status) {
          case 403:
            errorTitle = "Access Denied";
            errorDescription = error.message || "You don't have permission to delete assets. Only universal users and superusers can delete assets.";
            break;
          case 404:
            errorTitle = "Asset Not Found";
            errorDescription = error.message || "The asset you're trying to delete does not exist.";
            break;
          case 409:
            errorTitle = "Cannot Delete Asset";
            errorDescription = error.message || "Cannot delete asset. It may be referenced by other records or have child assets. Please remove all references first.";
            break;
          case 500:
            errorTitle = "Server Error";
            errorDescription = error.message || "An unexpected error occurred while deleting the asset. Please try again later.";
            break;
          default:
            errorDescription = error.message || errorDescription;
        }
      } else if (error instanceof Error) {
        errorDescription = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle dialog state changes
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        cmmsInternalId: '',
        name: '',
        description: '',
        functionalLocation: '',
        functionalLocationDesc: '',
        functionalLocationLongDesc: '',
        parent: null,
        maintenancePlant: '',
        cmmsSystem: '',
        objectType: '',
        systemStatus: 'Active',
        make: '',
        manufacturer: '',
        serialNumber: ''
      })
    }
    setShowAddDialog(open)
  }

  const renderAssets = () => {
    // Show loading state during server-side rendering
    if (!mounted) {
      return (
        <tr>
          <td colSpan={3} className="px-6 py-8 text-center">
            <div className="animate-pulse">Loading...</div>
          </td>
        </tr>
      )
    }

    if (isLoading) {
      return (
        <tr>
          <td colSpan={3} className="px-6 py-8 text-center">
            <div className="animate-pulse">Loading assets...</div>
          </td>
        </tr>
      )
    }

    if (error) {
      return (
        <tr>
          <td colSpan={3} className="px-6 py-8 text-center text-red-500">
            {error}
          </td>
        </tr>
      )
    }

    if (assets.length === 0) {
      return (
        <tr>
          <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
            No assets found.
          </td>
        </tr>
      )
    }

    const renderAssetRow = (asset: Asset) => {
      // Use id for parent-child relationships
      const children = assets.filter(a => a.parent === asset.id);
      const isExpanded = expandedAssets.has(asset.id);
      
      // Calculate the indentation level
      const getIndentationLevel = (assetId: string): number => {
        let level = 0;
        let currentAsset = assets.find(a => a.id === assetId);
        while (currentAsset?.parent) {
          level++;
          currentAsset = assets.find(a => a.id === currentAsset?.parent);
        }
        return level;
      };

      const indentationLevel = getIndentationLevel(asset.id);
      
      return (
        <React.Fragment key={asset.id}>
          <tr className="border-b hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div style={{ width: `${indentationLevel * 24}px` }} /> {/* Add indentation */}
                {children.length > 0 ? (
                  <button
                    onClick={() => toggleAsset(asset.id)}
                    className="mr-2 p-1 hover:bg-gray-200 rounded-md focus:outline-none flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="w-6 mr-2" />
                )}
                <span className="font-medium">{asset.id}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <div 
                className="cursor-pointer hover:text-blue-600 flex items-start gap-2"
                onClick={() => handleAssetClick(asset)}
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-medium">{asset.name}</span>
                  <span className="text-sm text-gray-500">
                    {asset.parent ? `Parent: ${asset.parent}` : 'Root Asset'}
                  </span>
                </div>
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
              <button
                onClick={(e) => openDeleteDialog(asset, e)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md focus:outline-none transition-colors inline-flex items-center justify-center ml-auto"
                title="Delete asset"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </td>
          </tr>
          {isExpanded && children.map(child => renderAssetRow(child))}
        </React.Fragment>
      );
    };

    // Get root level assets
    const rootAssets = assets.filter(asset => !asset.parent);
    
    return rootAssets.map(asset => renderAssetRow(asset));
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">

      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Asset Hierarchy</h1>
        {canCreateAssets && (
          <CommonButton
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </CommonButton>
        )}
      </div>

      {!canViewAssets && (
        <div className="bg-red-100 p-4 rounded-lg mb-4">
          <p className="text-red-700">You don&apos;t have permission to view the Asset Hierarchy.</p>
        </div>
      )}

      {canViewAssets && (
        <div className="bg-white rounded-lg shadow h-[calc(100vh-200px)]">
          <div className="h-full flex flex-col overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : (
                    renderAssets()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset ID</Label>
                <p className="text-sm">{selectedAsset.id}</p>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <p className="text-sm">{selectedAsset.name}</p>
              </div>
              <div className="space-y-2">
              <Label>Description</Label>
                <p className="text-sm">{selectedAsset.description}</p>
              </div>
              <div className="space-y-2">
                <Label>Functional Location</Label>
                <p className="text-sm">{selectedAsset.functionalLocation || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>Functional Location Description</Label>
                <p className="text-sm">{selectedAsset.functionalLocationDesc}</p>
              </div>
              <div className="space-y-2">
                <Label>Maintenance Plant</Label>
                <p className="text-sm">{selectedAsset.maintenancePlant || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>CMMS Internal ID</Label>
                <p className="text-sm">{selectedAsset.cmmsInternalId || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>Parent</Label>
                <p className="text-sm">{selectedAsset.parent || 'No Parent'}</p>
              </div>
              <div className="space-y-2">
                <Label>CMMS System</Label>
                <p className="text-sm">{selectedAsset.cmmsSystem || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>Object Type</Label>
                <p className="text-sm">{selectedAsset.objectType || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label>System Status</Label>
                <p className="text-sm">{selectedAsset.systemStatus}</p>
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
              <div className="space-y-2">
                <Label>Level</Label>
                <p className="text-sm">{selectedAsset.level}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4 p-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Main Pump"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Primary water pump"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Functional Location</Label>
                <Input
                  name="functionalLocation"
                  value={formData.functionalLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., Main Pump"
                />
              </div>
              <div className="space-y-2">
                <Label>Functional Location Description</Label>
                <Input
                  name="functionalLocationDesc"
                  value={formData.functionalLocationDesc}
                  onChange={handleInputChange}
                  placeholder="e.g., Primary water pump"
                  required
                />
              </div>
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
                <Label>CMMS System</Label>
                <Input
                  name="cmmsSystem"
                  value={formData.cmmsSystem}
                  onChange={handleInputChange}
                  placeholder="e.g., Salt Lake City"
                />
              </div>
              <div className="space-y-2">
                <AssetSelector
                  value={formData.parent || ''}
                  onValueChange={handleParentChange}
                  title="Parent Asset"
                  placeholder="Select parent asset"
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
          </form>
          <div className="flex justify-end gap-4 mt-4 pt-4 border-t">
            <CommonButton 
              type="button" 
              variant="outline" 
              onClick={() => handleDialogChange(false)}
            >
              Cancel
            </CommonButton>
            <CommonButton 
              type="submit"
              form="add-asset-form"
              onClick={handleSubmit}
            >
              Add Asset
            </CommonButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
              {assetToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Asset Details:</p>
                  <p className="text-sm text-gray-600">ID: {assetToDelete.id}</p>
                  <p className="text-sm text-gray-600">Name: {assetToDelete.name}</p>
                  <p className="text-sm text-gray-600">Type: {assetToDelete.objectType || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Location: {assetToDelete.functionalLocation || 'N/A'}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAsset}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Asset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {autoFillParent && (
        <Dialog open={showAutoFillDialog} onOpenChange={setShowAutoFillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto Fill From Parent</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maintenance Plant</Label>
              <p className="text-sm">{autoFillParent.maintenancePlant}</p>
            </div>
            <div className="space-y-2">
              <Label>CMMS System</Label>
              <p className="text-sm">{autoFillParent.cmmsSystem}</p>
            </div>
            <div className="space-y-2">
              <Label>Make</Label>
              <p className="text-sm">{autoFillParent.make}</p>
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <p className="text-sm">{autoFillParent.manufacturer}</p>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4 pt-4 border-t">
            <CommonButton 
              type="button" 
              variant="outline" 
              onClick={() => setShowAutoFillDialog(false)}
            >
              No
            </CommonButton>
            <CommonButton 
              type="button" 
              variant="outline" 
              onClick={() => handleAutoFillParent(autoFillParent)}
            >
              Yes
            </CommonButton>
          </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
} 

