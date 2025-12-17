"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskHazardApi } from "@/services"
import type { TaskHazard, RiskType } from "@/types"
import { riskCategories, getConsequenceLabels, getRiskScore, getRiskColor, getRiskColorText } from "@/lib/risk-utils"


import { GeoFenceSettings } from '../GeoFenceSettings'
import { AssetSelector } from '../AssetSelector'
import { RiskMatrix } from '../RiskMatrix'
import { UserSelector } from '../UserSelector'
import { LocationSelector } from '../LocationSelector'

// Form-specific Risk type that allows empty strings
interface FormRisk {
  id: string;
  riskDescription: string;
  riskType: string; // Allow empty string in form
  asIsLikelihood: string;
  asIsConsequence: string;
  mitigatingAction: string;
  mitigatedLikelihood: string;
  mitigatedConsequence: string;
  mitigatingActionType: string;
  requiresSupervisorSignature: boolean;
}

interface TaskHazardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  task?: TaskHazard | null;
  onSuccess?: () => void;
}

export default function TaskHazardForm({
  open,
  onOpenChange,
  mode,
  task: initialTask,
  onSuccess
}: TaskHazardFormProps) {
  const { toast } = useToast() as { toast: (params: { title: string; description: string; variant?: "default" | "destructive" }) => void }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [openGeoFence, setOpenGeoFence] = useState(false)
  const [showRiskMatrix, setShowRiskMatrix] = useState(false)
  const [activeRiskId, setActiveRiskId] = useState<string | null>(null)
  const [isAsIsMatrix, setIsAsIsMatrix] = useState(true)
  const [task, setTask] = useState<TaskHazard | null>(initialTask || null)

  // Memoize the role filter to prevent unnecessary re-renders
  const supervisorRoleFilter = useMemo(() => ['supervisor', 'admin', 'superuser'], [])

  // Memoize the onChange callbacks to prevent unnecessary re-renders
  const handleIndividualsChange = useCallback((individuals: string | string[]) => {
    setFormData(prev => ({...prev, individuals: individuals as string[]}))
  }, [])

  const handleSupervisorChange = useCallback((supervisor: string | string[]) => {
    setFormData(prev => ({...prev, supervisor: supervisor as string}))
  }, [])

  const handleAssetSystemChange = useCallback((assetId: string) => {
    setFormData(prev => ({...prev, assetSystem: assetId}))
  }, [])

  const handleLocationChange = useCallback((location: string) => {
    setFormData(prev => ({...prev, location: location}))
  }, [])

  useEffect(() => {
    if (initialTask) {
      const fetchTask = async () => {
        const response = await TaskHazardApi.getTaskHazard(initialTask.id)
        console.log(response.data)
        setTask(response.data)
      }
      fetchTask();
    }
  }, [initialTask])

  // Convert API risks to local format
  const convertApiRisksToLocal = (apiRisks: TaskHazard['risks']): FormRisk[] => {
    if (!apiRisks) return [];
    return apiRisks.map(risk => ({
      id: risk.id || Date.now().toString(),
      riskDescription: risk.riskDescription || "",
      riskType: risk.riskType || "",
      asIsLikelihood: risk.asIsLikelihood || "",
      asIsConsequence: risk.asIsConsequence || "",
      mitigatingAction: risk.mitigatingAction || "",
      mitigatedLikelihood: risk.mitigatedLikelihood || "",
      mitigatedConsequence: risk.mitigatedConsequence || "",
      mitigatingActionType: risk.mitigatingActionType || "",
      requiresSupervisorSignature: risk.requiresSupervisorSignature || false,
    }));
  };

  // Initialize form data based on mode
  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && task) {
      return {
        id: task.id,
        date: task.date,
        time: task.time,
        scopeOfWork: task.scopeOfWork,
        assetSystem: task.assetSystem,
        systemLockoutRequired: task.systemLockoutRequired,
        trainedWorkforce: task.trainedWorkforce,
        risks: convertApiRisksToLocal(task.risks),
        individuals: Array.isArray(task.individuals) 
          ? task.individuals 
          : task.individuals ? task.individuals.split(',').map(email => email.trim()).filter(Boolean) : [],
        supervisor: task.supervisor,
        status: task.status,
        location: task.location,
        geoFenceLimit: task.geoFenceLimit || 200,
      }
    }
    return {
      date: "",
      time: "",
      scopeOfWork: "",
      assetSystem: "",
      systemLockoutRequired: false,
      trainedWorkforce: false,
      risks: [] as FormRisk[],
      individuals: [] as string[],
      supervisor: "",
      status: "Active",
      location: "",
      geoFenceLimit: 200,
    }
  })

  // Update form data when task changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && task) {
      setFormData({
        id: task.id,
        date: task.date,
        time: task.time,
        scopeOfWork: task.scopeOfWork,
        assetSystem: task.assetSystem,
        systemLockoutRequired: task.systemLockoutRequired,
        trainedWorkforce: task.trainedWorkforce,
        risks: convertApiRisksToLocal(task.risks),
        individuals: Array.isArray(task.individuals) 
          ? task.individuals 
          : task.individuals ? task.individuals.split(',').map(email => email.trim()).filter(Boolean) : [],
        supervisor: task.supervisor,
        status: task.status,
        location: task.location,
        geoFenceLimit: task.geoFenceLimit || 200,
      })
      setOpenGeoFence(false);
    }
  }, [mode, task])

  const setGeoFenceLimit = (limit: number) => {
    setFormData(prev => ({...prev, geoFenceLimit: limit}))
  }

  // Set current date/time when opening in create mode
  useEffect(() => {
    if (open && mode === 'create') {
      const now = new Date()
      // Use local date (not UTC) to match local time
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const currentDate = `${year}-${month}-${day}`
      const currentTime = now.toTimeString().slice(0, 8)
      setFormData(prev => ({
        ...prev,
        date: currentDate,
        time: currentTime
      }))
    }
  }, [open, mode])

  // Validate form data
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    if (!formData.date) errors.date = "Date is required";
    if (!formData.time) errors.time = "Time is required";
    if (!formData.scopeOfWork?.trim()) errors.scopeOfWork = "Scope of work is required";
    if (!formData.assetSystem) errors.assetSystem = "Asset system is required";
    if (!formData.individuals || formData.individuals.length === 0) errors.individuals = "At least one individual/team member is required";
    if (!formData.supervisor) errors.supervisor = "Supervisor is required";
    if (!formData.location?.trim()) errors.location = "Location is required";
    
    // Validate risks
    if (formData.risks.length === 0) {
      errors.risks = "At least one risk must be added";
    } else {
      formData.risks.forEach((risk, index) => {
        if (!risk.riskDescription?.trim()) {
          errors[`risk_${index}_description`] = `Risk ${index + 1} description is required`;
        }
        if (!risk.riskType) {
          errors[`risk_${index}_type`] = `Risk ${index + 1} type is required`;
        }
        if (!risk.mitigatingAction?.trim()) {
          errors[`risk_${index}_mitigation`] = `Risk ${index + 1} mitigating action is required`;
        }
      });
    }
    
    setValidationErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Calculate risk score for display
  const calculateRiskScore = (risk: FormRisk, isAsIs: boolean = true) => {
    const likelihood = isAsIs ? risk.asIsLikelihood : risk.mitigatedLikelihood;
    const consequence = isAsIs ? risk.asIsConsequence : risk.mitigatedConsequence;
    
    if (!likelihood || !consequence || !risk.riskType) return null;
    
    return getRiskScore(likelihood, consequence, getConsequenceLabels(risk.riskType as RiskType));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: Object.values(validation.errors).at(0) || "Please fix the errors below and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if any risks require supervisor signature
      const requiresSupervisorApproval = formData.risks.some(risk => risk.requiresSupervisorSignature);
      
      const { individuals, ...formDataWithoutIndividuals } = formData;
      const formattedData = {
        ...formDataWithoutIndividuals,
        individuals: individuals.join(', '), // Convert array to comma-separated string for API
        risks: formData.risks.map(risk => ({
          id: risk.id || "",
          riskDescription: risk.riskDescription || "",
          riskType: risk.riskType as RiskType,
          asIsLikelihood: risk.asIsLikelihood || "",
          asIsConsequence: risk.asIsConsequence || "",
          mitigatingAction: risk.mitigatingAction || "",
          mitigatingActionType: risk.mitigatingActionType || "",
          mitigatedLikelihood: risk.mitigatedLikelihood || "",
          mitigatedConsequence: risk.mitigatedConsequence || "",
          requiresSupervisorSignature: risk.requiresSupervisorSignature || false
        }))
      };
      
      if (mode === 'create') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...createData } = formattedData;
        await TaskHazardApi.createTaskHazard(createData);
        toast({
          title: "Success",
          description: requiresSupervisorApproval 
            ? "Task hazard assessment has been created and is pending supervisor approval."
            : "Task hazard assessment has been created successfully.",
          variant: "default",
        })
      } else {
        const taskId = formattedData.id;
        if (!taskId) {
          throw new Error('Task ID is required for updates');
        }
        await TaskHazardApi.updateTaskHazard(taskId, formattedData);
        if (formattedData.status === 'Completed') {
          toast({
            title: "Success",
            description: "Task hazard assessment has been updated successfully.",
            variant: "default",
          })
        } else {
          toast({
            title: "Success",
            description: requiresSupervisorApproval 
              ? "Task hazard assessment has been updated and is pending supervisor approval."
              : "Task hazard assessment has been updated successfully.",
            variant: "default",
          })
        }
      }
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} task:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${mode === 'create' ? 'create' : 'update'} task hazard assessment. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false);
    }
  }

  const addRisk = () => {
    const newRisk: FormRisk = {
      id: Date.now().toString(),
      riskDescription: "",
      riskType: "",
      asIsLikelihood: "",
      asIsConsequence: "",
      mitigatingAction: "",
      mitigatedLikelihood: "",
      mitigatedConsequence: "",
      mitigatingActionType: "",
      requiresSupervisorSignature: false,
    }
    setFormData(prev => ({
      ...prev,
      risks: [...prev.risks, newRisk]
    }))
  }

  const updateRisk = (riskId: string, updates: Partial<FormRisk>) => {
    setFormData(prev => ({
      ...prev,
      risks: prev.risks.map(risk => 
        risk.id === riskId ? { ...risk, ...updates } : risk
      )
    }))
  }

  const removeRisk = (riskId: string) => {
    setFormData(prev => ({
      ...prev,
      risks: prev.risks.filter(risk => risk.id !== riskId)
    }))
  }

  const openRiskMatrix = (riskId: string, isAsIs: boolean) => {
    setActiveRiskId(riskId);
    setIsAsIsMatrix(isAsIs);
    setShowRiskMatrix(true);
  }

  const handleRiskUpdate = (riskId: string, updates: Partial<FormRisk>) => {
    // Update the risk in formData
    const updatedRisks = formData.risks.map(risk => 
      risk.id === riskId 
        ? { ...risk, ...updates }
        : risk
    );
    
    const requiresApproval = !isAsIsMatrix ? updatedRisks.some(risk => risk.requiresSupervisorSignature) : false;
    
    // Update the form data with new risks and status
    setFormData(prev => ({
      ...prev,
      risks: updatedRisks,
      // If any risk requires signature -> Pending, otherwise keep current status or set to Active
      status: requiresApproval ? 'Pending' : (prev.status === 'Pending' ? 'Active' : prev.status)
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl mx-auto h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === 'create' ? 'Add New Task Hazard Assessment' : 'Edit Task Hazard Assessment'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                className={`h-11 ${validationErrors.date ? "border-red-500" : ""}`}
              />
              {validationErrors.date && (
                <span className="text-red-500 text-xs">{validationErrors.date}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({...prev, time: e.target.value}))}
                className={`h-11 ${validationErrors.time ? "border-red-500" : ""}`}
              />
              {validationErrors.time && (
                <span className="text-red-500 text-xs">{validationErrors.time}</span>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="scopeOfWork" className="text-sm font-medium">Scope of Work</Label>
              <Input
                id="scopeOfWork"
                value={formData.scopeOfWork}
                onChange={(e) => setFormData(prev => ({...prev, scopeOfWork: e.target.value}))}
                placeholder="Enter scope of work"
                className={`h-11 ${validationErrors.scopeOfWork ? "border-red-500" : ""}`}
              />
              {validationErrors.scopeOfWork && (
                <span className="text-red-500 text-xs">{validationErrors.scopeOfWork}</span>
              )}
            </div>
            <div className="md:col-span-2">
              <AssetSelector
                value={formData.assetSystem}
                onValueChange={handleAssetSystemChange}
                error={validationErrors.assetSystem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemLockout" className="text-sm font-medium">System Lockout Required</Label>
              <select
                id="systemLockout"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.systemLockoutRequired.toString()}
                onChange={(e) => setFormData(prev => ({...prev, systemLockoutRequired: e.target.value === 'true'}))}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainedWorkforce" className="text-sm font-medium">Trained Workforce</Label>
              <select
                id="trainedWorkforce"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.trainedWorkforce.toString()}
                onChange={(e) => setFormData(prev => ({...prev, trainedWorkforce: e.target.value === 'true'}))}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-2">
               <UserSelector
                 value={formData.individuals}
                 onChange={handleIndividualsChange}
                 error={validationErrors.individuals}
                 label="Individual/Team"
                 placeholder="Select individuals/team members"
                 multiple={true}
               />
             </div>
            <div className="space-y-2">
              <UserSelector
                value={formData.supervisor || ""}
                onChange={handleSupervisorChange}
                error={validationErrors.supervisor}
                label="Supervisor"
                placeholder="Select supervisor"
                multiple={false}
                roleFilter={supervisorRoleFilter}
              />
            </div>
            {openGeoFence ? (
              <GeoFenceSettings
              open={openGeoFence}
              onOpenChange={setOpenGeoFence}
              initialLimit={formData.geoFenceLimit}
              onSave={setGeoFenceLimit}
            />
            ) : (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="geoFence" className="text-sm font-medium">Geo Fence Settings</Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex justify-between items-center h-11 px-4"
                  onClick={() => setOpenGeoFence(true)}
                >
                  <span className="text-sm">Configure Geo Fence Limit</span>
                  <span className="text-sm text-gray-500">
                    Current: {formData.geoFenceLimit || 200} Feet
                  </span>
                </Button>
              </div>
            </div>
            )}
            <div className="md:col-span-2">
              <LocationSelector
                value={formData.location}
                onChange={handleLocationChange}
                error={validationErrors.location}
                label="Location"
                placeholder="Enter location or click on map"
              />
            </div>
            {mode === 'edit' && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <select
                    id="status"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({...prev, status: e.target.value}))}
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                {task?.latestApproval && task.latestApproval.status === 'rejected' && (
                <div className="space-y-2">
                  <Label htmlFor="Comments" className="text-sm font-medium">Comments</Label>
                  <p>{(() => {
                    const comments = task?.latestApproval?.comments || "No comments"
                    return comments.split('Comments: ').at(-1);
                  })()}</p>
                </div>
                )}
              </>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <Label className="text-sm font-medium">Risks and Controls</Label>
                {validationErrors.risks && (
                  <div className="text-red-500 text-xs mt-1">{validationErrors.risks}</div>
                )}
              </div>
              <Button 
                type="button"
                onClick={addRisk}
                className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 h-11 px-4 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Risk
              </Button>
            </div>
            
            {formData.risks.map((risk, index) => {
              const asIsScore = calculateRiskScore(risk, true);
              const mitigatedScore = calculateRiskScore(risk, false);
              
              return (
                <div key={risk.id} className="border rounded-lg p-4 space-y-4 relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">Risk {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => risk.id && removeRisk(risk.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Risk Description</Label>
                      <Input
                        value={risk.riskDescription || ""}
                        onChange={(e) => risk.id && updateRisk(risk.id, { riskDescription: e.target.value })}
                        placeholder="E.g., Risk of pinch point"
                        className={`h-11 mt-1 ${validationErrors[`risk_${index}_description`] ? "border-red-500" : ""}`}
                      />
                      {validationErrors[`risk_${index}_description`] && (
                        <span className="text-red-500 text-xs">{validationErrors[`risk_${index}_description`]}</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Risk Type</Label>
                        <Select
                          value={risk.riskType || ""}
                          onValueChange={(value) => risk.id && updateRisk(risk.id, { riskType: value })}
                        >
                          <SelectTrigger className={`h-11 mt-1 ${validationErrors[`risk_${index}_type`] ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select risk type" />
                          </SelectTrigger>
                          <SelectContent>
                            {riskCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors[`risk_${index}_type`] && (
                          <span className="text-red-500 text-xs">{validationErrors[`risk_${index}_type`]}</span>
                        )}
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Associated Risks</Label>
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full h-11 mt-1 ${getRiskColor(asIsScore || 0, risk.riskType || '')} hover:${getRiskColor(asIsScore || 0, risk.riskType || '')}`}
                          disabled={!risk.riskType}
                          
                          onClick={() => risk.id && openRiskMatrix(risk.id, true)}
                        >
                          {asIsScore !== null ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${getRiskColorText(asIsScore, risk.riskType || '')}`}>
                                {risk.asIsLikelihood} and {risk.asIsConsequence}
                              </span>
                              <span className={`text-xs ${getRiskColorText(asIsScore || 0, risk.riskType || '')}`}>Score {asIsScore}</span>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs">
                              {!risk.riskType ? "Select risk type first" : "Not assessed"}
                            </div>
                          )}
                        </Button>
                        {!risk.riskType && (
                          <div className="text-xs text-gray-500 mt-1">
                            Please select a risk type before assessing risks
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Mitigating Action</Label>
                      <Input
                        value={risk.mitigatingAction || ""}
                        onChange={(e) => risk.id && updateRisk(risk.id, { mitigatingAction: e.target.value })}
                        placeholder="E.g., Wear gloves"
                        className={`h-11 mt-1 ${validationErrors[`risk_${index}_mitigation`] ? "border-red-500" : ""}`}
                      />
                      {validationErrors[`risk_${index}_mitigation`] && (
                        <span className="text-red-500 text-xs">{validationErrors[`risk_${index}_mitigation`]}</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Mitigating Action Type</Label>
                        <Select
                          value={risk.mitigatingActionType || ""}
                          onValueChange={(value) => risk.id && updateRisk(risk.id, { mitigatingActionType: value })}
                        >
                          <SelectTrigger className="h-11 mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Elimination">Elimination</SelectItem>
                            <SelectItem value="Control">Control</SelectItem>
                            <SelectItem value="Administrative">Administrative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Post-Mitigation Risk Assessment</Label>
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full h-11 mt-1 ${getRiskColor(mitigatedScore || 0, risk.riskType || '')} hover:${getRiskColor(mitigatedScore || 0, risk.riskType || '')}`}
                          disabled={!risk.mitigatingActionType}
                          onClick={() => risk.id && openRiskMatrix(risk.id, false)}
                        >
                          {mitigatedScore !== null ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${getRiskColorText(mitigatedScore, risk.riskType || '')}`}>
                                {risk.mitigatedLikelihood} and {risk.mitigatedConsequence}
                              </span>
                              <span className={`text-xs ${getRiskColorText(mitigatedScore, risk.riskType || '')}`}>Score {mitigatedScore}</span>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs">
                              {!risk.mitigatingActionType ? "Select mitigating action type first" : "Not assessed"}
                            </div>
                          )}
                        </Button>
                        {!risk.mitigatingActionType && (
                          <div className="text-xs text-gray-500 mt-1">
                            Please select a mitigating action type before assessing post-mitigation risks
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {risk.requiresSupervisorSignature && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <span className="text-amber-700 text-sm">⚠️ Supervisor signature required - Status will remain pending until approved</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
              className="h-11 px-6 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 h-11 px-6 w-full sm:w-auto" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Create Assessment' : 'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
      <RiskMatrix
        open={showRiskMatrix}
        onOpenChange={setShowRiskMatrix}
        riskId={activeRiskId}
        isAsIsMatrix={isAsIsMatrix}
        risk={formData.risks.find(r => r.id === activeRiskId) ? {
          ...formData.risks.find(r => r.id === activeRiskId)!,
          riskType: formData.risks.find(r => r.id === activeRiskId)!.riskType as RiskType
        } : null}
        onRiskUpdate={handleRiskUpdate}
      />
    </Dialog>
  )
} 