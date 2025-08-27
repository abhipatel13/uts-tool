"use client"

import { useState, useEffect } from 'react'
import { CommonButton } from "@/components/ui/common-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Plus, ChevronDown, Save, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { hasPermission } from "@/utils/auth"
import { TacticsApi } from "@/services"
import type { Tactic } from "@/types"

interface AssetRow {
  assetNumber: string;
  manufacturer: string;
  model: string;
  assetGroup: string;
  assetDescription: string;
  criticality: string;
  failureMode: string;
  failureCause: string;
  failureEffect: string;
  step1FailureEvident: string;
  step2AffectsSafetyEnvironment: string;
  step3SuitableTaskExists: string;
  maintenanceStrategy: string;
  currentControls: string;
  recommendedActions: string;
  responsibility: string;
  activityName: string;
  activityDescription: string;
  activityType: string;
  activityCause: string;
  activitySource: string;
  tactic: string;
  shutdownType: string;
  department: string;
  frequency: string;
  documentNumber: string;
  documentDescription: string;
  picture: string;
  resourceType: string;
  usageHours: string;
  assignedUnits: string;
  majorOverhaul: string;
  otherShutdowns: string;
}

interface FormData {
  analysis_name: string;
  location: string;
  status: 'active' | 'pending' | 'inactive' | '';
  assetRows: AssetRow[];
}

const PREDEFINED_VALUES = {
  failure_evident: 'Yes',
  affects_safety: 'No',
  suitable_task: 'Yes',
  maintenance_strategy: 'Schedule preventive'
} as const;

const EMPTY_ROW: AssetRow = {
  assetNumber: '',
  manufacturer: '',
  model: '',
  assetGroup: '',
  assetDescription: '',
  criticality: '',
  failureMode: '',
  failureCause: '',
  failureEffect: '',
  step1FailureEvident: PREDEFINED_VALUES.failure_evident,
  step2AffectsSafetyEnvironment: PREDEFINED_VALUES.affects_safety,
  step3SuitableTaskExists: PREDEFINED_VALUES.suitable_task,
  maintenanceStrategy: PREDEFINED_VALUES.maintenance_strategy,
  currentControls: '',
  recommendedActions: '',
  responsibility: '',
  activityName: '',
  activityDescription: '',
  activityType: '',
  activityCause: '',
  activitySource: '',
  tactic: '',
  shutdownType: '',
  department: '',
  frequency: '',
  documentNumber: '',
  documentDescription: '',
  picture: '',
  resourceType: '',
  usageHours: '',
  assignedUnits: '',
  majorOverhaul: '',
  otherShutdowns: ''
}

const COLUMNS = [
  { key: 'assetNumber', label: 'Asset Number' },
  { key: 'assetDescription', label: 'Asset Description' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'model', label: 'Model' },
  { key: 'assetGroup', label: 'Asset Group' },
  { key: 'criticality', label: 'Criticality' },
  { key: 'failureMode', label: 'Failure Mode' },
  { key: 'failureCause', label: 'Failure Cause' },
  { key: 'failureEffect', label: 'Failure Effect' },
  { key: 'step1FailureEvident', label: 'Step 1: Failure Evident?' },
  { key: 'step2AffectsSafetyEnvironment', label: 'Step 2: Affects Safety/Environment?' },
  { key: 'step3SuitableTaskExists', label: 'Step 3: Suitable Task Exists?' },
  { key: 'maintenanceStrategy', label: 'Maintenance Strategy' },
  { key: 'currentControls', label: 'Current Controls' },
  { key: 'recommendedActions', label: 'Recommended Actions' },
  { key: 'responsibility', label: 'Responsibility' },
  { key: 'activityName', label: 'Activity Name' },
  { key: 'activityDescription', label: 'Activity Description' },
  { key: 'activityType', label: 'Activity Type' },
  { key: 'activityCause', label: 'Activity Cause' },
  { key: 'activitySource', label: 'Activity Source' },
  { key: 'tactic', label: 'Tactic' },
  { key: 'shutdownType', label: 'Shutdown Type' },
  { key: 'department', label: 'Department' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'documentNumber', label: 'Document Number' },
  { key: 'documentDescription', label: 'Document Description' },
  { key: 'picture', label: 'Picture' },
  { key: 'resourceType', label: 'Resource Type' },
  { key: 'usageHours', label: 'Usage (Hrs)' },
  { key: 'assignedUnits', label: 'Assigned Units' },
  { key: 'majorOverhaul', label: 'Major Overhaul' },
  { key: 'otherShutdowns', label: 'Other Shutdowns' }
];

export default function TacticsPage() {
  const { toast } = useToast()
  const [tactics, setTactics] = useState<Tactic[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAssetDialog, setShowAssetDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedTactic, setSelectedTactic] = useState<Tactic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteTacticId, setDeleteTacticId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    analysis_name: '',
    location: '',
    status: '',
    assetRows: [{ ...EMPTY_ROW }]
  })

  // Check permissions
  const canCreateTactics = hasPermission("create_tactics");

  useEffect(() => {
    fetchTactics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTactics = async () => {
    try {
      const response = await TacticsApi.getAll();
      setTactics(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user || !user.company) {
        throw new Error('User company information not found');
      }

      const response = await TacticsApi.create({
        analysis_name: formData.analysis_name,
        location: formData.location,
        status: formData.status,
        company: user.company,
        created_by: user.id || 'unknown',
        asset_details: {
          asset_id: formData.assetRows[0].assetNumber,
          manufacturer: formData.assetRows[0].manufacturer,
          model: formData.assetRows[0].model,
          asset_group: formData.assetRows[0].assetGroup,
          description: formData.assetRows[0].assetDescription,
          criticality: formData.assetRows[0].criticality,
          failure_mode: formData.assetRows[0].failureMode,
          failure_cause: formData.assetRows[0].failureCause,
          failure_effect: formData.assetRows[0].failureEffect,
          failure_evident: formData.assetRows[0].step1FailureEvident,
          affects_safety: formData.assetRows[0].step2AffectsSafetyEnvironment,
          suitable_task: formData.assetRows[0].step3SuitableTaskExists,
          maintenance_strategy: formData.assetRows[0].maintenanceStrategy,
          controls: formData.assetRows[0].currentControls,
          actions: formData.assetRows[0].recommendedActions,
          responsibility: formData.assetRows[0].responsibility,
          activity_name: formData.assetRows[0].activityName,
          activity_desc: formData.assetRows[0].activityDescription,
          activity_type: formData.assetRows[0].activityType,
          activity_cause: formData.assetRows[0].activityCause,
          activity_source: formData.assetRows[0].activitySource,
          tactic: formData.assetRows[0].tactic,
          shutdown: formData.assetRows[0].shutdownType,
          department: formData.assetRows[0].department,
          frequency: formData.assetRows[0].frequency,
          doc_number: formData.assetRows[0].documentNumber,
          doc_desc: formData.assetRows[0].documentDescription,
          picture: formData.assetRows[0].picture,
          resource: formData.assetRows[0].resourceType,
          hours: formData.assetRows[0].usageHours,
          units: formData.assetRows[0].assignedUnits,
          overhaul: formData.assetRows[0].majorOverhaul,
          shutdowns: formData.assetRows[0].otherShutdowns
        }
      });
      
      setTactics([...tactics, response.data]);
      setFormData({
        analysis_name: '',
        location: '',
        status: '',
        assetRows: [{ ...EMPTY_ROW }]
      });
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: "Tactic added successfully"
      });
      fetchTactics();
    } catch (error) {
      console.error("Error creating tactic:", error);
      toast({
        title: "Error",
        description: "Failed to add tactic",
        variant: "destructive"
      });
    }
  };

  const handleAddRow = () => {
    setFormData(prev => ({
      ...prev,
      assetRows: [...prev.assetRows, { ...EMPTY_ROW }]
    }))
  }

  const handleRowChange = (index: number, field: keyof AssetRow, value: string) => {
    const newRows = [...formData.assetRows]
    newRows[index] = {
      ...newRows[index],
      [field]: value
    }
    setFormData(prev => ({
      ...prev,
      assetRows: newRows
    }))
  }

  const handleAssetSave = () => {
    setShowAssetDialog(false)
    toast({
      title: "Success",
      description: "Asset details saved",
    })
  }

  const handleRowClick = (tactic: Tactic) => {
    setSelectedTactic(tactic);
    setShowDetailsDialog(true);
  };

  const handleDeleteTactic = async () => {
    if (!deleteTacticId) return;
    
    try {
      await TacticsApi.delete(deleteTacticId);
      await fetchTactics();
      toast({
        title: "Success",
        description: "Tactic deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting tactic:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete tactic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteTacticId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Highlight matching text in search results
  const highlightMatch = (text: string | undefined | null, searchTerm: string) => {
    if (!text || !searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
      </div>
      
      {/* Responsive header section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50]">Tactics</h1>
          
          {/* Search and Add button row */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="flex-1 sm:max-w-md order-2 sm:order-1">
              <Input 
                className="w-full" 
                placeholder="Search tactics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {canCreateTactics && (
              <CommonButton 
                className="gap-2 w-full sm:w-auto sm:flex-shrink-0 order-1 sm:order-2" 
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4" /> ADD NEW
              </CommonButton>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Tactic</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this tactic? This action cannot be undone.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
            <CommonButton variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </CommonButton>
            <CommonButton 
              variant="destructive" 
              onClick={handleDeleteTactic}
              className="w-full sm:w-auto"
            >
              Delete
            </CommonButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto min-w-[800px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">ID</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm">Analysis Name</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Location</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Status</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Created</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && !error && tactics.length > 0 &&
                tactics
                  .filter(tactic => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      (tactic.analysis_name && tactic.analysis_name.toLowerCase().includes(searchLower)) ||
                      (tactic.location && tactic.location.toLowerCase().includes(searchLower)) ||
                      (tactic.status && tactic.status.toLowerCase().includes(searchLower)) ||
                      (tactic.id && tactic.id.toString().includes(searchLower))
                    );
                  })
                  .map(tactic => (
                    <tr 
                      key={tactic.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(tactic)}
                    >
                      <td className="p-3 sm:p-4">
                        <div className="text-sm font-medium">{highlightMatch(tactic.id, searchTerm)}</div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="text-sm break-words">{highlightMatch(tactic.analysis_name, searchTerm)}</div>
                      </td>
                      <td className="p-3 sm:p-4 text-sm">{highlightMatch(tactic.location, searchTerm)}</td>
                      <td className="p-3 sm:p-4">
                        <span className={`px-2 py-1 rounded-full text-xs 
                          ${tactic.status.toLowerCase() === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : tactic.status.toLowerCase() === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {tactic.status}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-sm">
                        {tactic.created_at ? new Date(tactic.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex gap-1 sm:gap-2">
                          <CommonButton
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-9 sm:w-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTacticId(tactic.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </CommonButton>
                        </div>
                      </td>
                    </tr>
                  ))
              }
              {(!isLoading && !error && tactics.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-lg">No tactics found</div>
                      <div className="text-sm">Create a new tactic to get started.</div>
                    </div>
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A3FF]"></div>
                      <span>Loading tactics...</span>
                    </div>
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-red-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-lg">Error loading tactics</div>
                      <div className="text-sm">{error}</div>
                      <CommonButton 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchTactics}
                        className="mt-2"
                      >
                        Try Again
                      </CommonButton>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden">
        {!isLoading && !error && tactics.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg">No tactics found</div>
              <div className="text-sm">Create a new tactic to get started.</div>
            </div>
          </div>
        )}
        
        {!isLoading && !error && tactics.length > 0 && (
          <div className="space-y-4">
            {tactics
              .filter(tactic => {
                const searchLower = searchTerm.toLowerCase();
                return (
                  (tactic.analysis_name && tactic.analysis_name.toLowerCase().includes(searchLower)) ||
                  (tactic.location && tactic.location.toLowerCase().includes(searchLower)) ||
                  (tactic.status && tactic.status.toLowerCase().includes(searchLower)) ||
                  (tactic.id && tactic.id.toString().includes(searchLower))
                );
              })
              .map(tactic => (
                <div 
                  key={tactic.id} 
                  className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRowClick(tactic)}
                >
                  {/* Header with ID and Actions */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#2C3E50] mb-1">
                        Tactic ID: {highlightMatch(tactic.id, searchTerm)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          tactic.status.toLowerCase() === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : tactic.status.toLowerCase() === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tactic.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {tactic.created_at ? new Date(tactic.created_at).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                    <CommonButton
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTacticId(tactic.id);
                        setIsDeleteDialogOpen(true);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </CommonButton>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Analysis Name</div>
                      <div className="text-sm text-gray-900">{highlightMatch(tactic.analysis_name, searchTerm)}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <div className="text-xs text-gray-600 font-medium">Location</div>
                        <div className="text-sm text-gray-900">{highlightMatch(tactic.location, searchTerm)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Analysis</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Analysis Name</Label>
                  <Input
                    value={formData.analysis_name}
                    onChange={(e) => setFormData({ ...formData, analysis_name: e.target.value })}
                    placeholder="Enter analysis name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as FormData['status'] })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Asset Details</Label>
                  <CommonButton 
                    type="button"
                    variant="outline"
                    className="w-full flex justify-between items-center"
                    onClick={() => setShowAssetDialog(true)}
                  >
                    {formData.assetRows.length > 1 ? `${formData.assetRows.length} Assets Added` : 'Add Asset Details'}
                    <ChevronDown className="h-4 w-4" />
                  </CommonButton>
                </div>
              </div>
              <div className="flex justify-end">
                <CommonButton type="submit">Add Analysis</CommonButton>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent className="sm:max-w-[95vw] h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <CommonButton onClick={handleAddRow} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </CommonButton>
              <div className="flex gap-2">
                <CommonButton onClick={handleAssetSave} variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </CommonButton>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto border rounded-md">
              <table className="w-full border-collapse min-w-max">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    {COLUMNS.map((col) => (
                      <th key={col.key} className={`border-r p-2 text-center bg-gray-50 font-medium text-sm ${
                        col.key === 'assetNumber' ? 'sticky left-0 z-20 bg-gray-50 w-[200px] min-w-[200px] max-w-[200px]' :
                        col.key === 'assetDescription' ? 'sticky left-[200px] z-10 bg-gray-50 w-[200px] min-w-[200px] max-w-[200px]' :
                        ''
                      }`}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.assetRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b">
                      {COLUMNS.map((col) => (
                        <td key={col.key} className={`border-r p-1 text-center ${
                          col.key === 'assetNumber' ? 'sticky left-0 z-20 bg-white w-[200px] min-w-[200px] max-w-[200px]' :
                          col.key === 'assetDescription' ? 'sticky left-[200px] z-10 bg-white w-[200px] min-w-[200px] max-w-[200px]' :
                          ''
                        }`}>
                          {col.key === 'step1FailureEvident' || 
                           col.key === 'step2AffectsSafetyEnvironment' || 
                           col.key === 'step3SuitableTaskExists' || 
                           col.key === 'maintenanceStrategy' ? (
                            <div className="px-2 py-1 bg-gray-50 text-gray-600">
                              {row[col.key]}
                            </div>
                          ) : (
                            <Input
                              value={row[col.key as keyof AssetRow]}
                              onChange={(e) => handleRowChange(rowIndex, col.key as keyof AssetRow, e.target.value)}
                              className="border-0 h-8 p-1 focus:ring-0 text-center"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[95vw] h-[80vh] overflow-hidden flex flex-col bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-[rgb(44,62,80)]">Analysis Details</DialogTitle>
          </DialogHeader>
          
          {selectedTactic && (
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-[rgb(44,62,80)] mb-4">Analysis Information</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Analysis Name</div>
                    <div className="font-medium">{selectedTactic.analysis_name}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Location</div>
                    <div className="font-medium">{selectedTactic.location}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className="font-medium">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        selectedTactic.status.toLowerCase() === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : selectedTactic.status.toLowerCase() === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedTactic.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[rgb(44,62,80)] mb-4">Asset Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  {selectedTactic.asset_details && Object.entries(selectedTactic.asset_details).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </div>
                      <div className="font-medium">
                        {key.includes('evident') || key.includes('safety') || key.includes('suitable_task') ? (
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            value === 'Yes' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {value}
                          </span>
                        ) : value || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}