"use client"

import React, { useState, useEffect } from 'react'
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
import { taskHazardApi, type TaskHazard, type Risk } from "@/services/api"
import { riskCategories, getConsequenceLabels, getRiskScore, getRiskColor } from "@/lib/risk-utils"
import { userApi, type User } from "@/services/userApi"
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import type { MapMouseEvent } from '@vis.gl/react-google-maps'
import { GeoFenceSettings } from './GeoFenceSettings'
import { AssetSelector } from './AssetSelector'
import { RiskMatrix } from './RiskMatrix'

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
  task,
  onSuccess
}: TaskHazardFormProps) {
  const { toast } = useToast() as { toast: (params: { title: string; description: string; variant?: "default" | "destructive" }) => void }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [selectedMapLocation, setSelectedMapLocation] = useState({ lat: 40.760780, lng: -111.891045 }) // Default to Salt Lake City, Utah
  const [openGeoFence, setOpenGeoFence] = useState(false)
  const [showRiskMatrix, setShowRiskMatrix] = useState(false)
  const [activeRiskId, setActiveRiskId] = useState<string | null>(null)
  const [isAsIsMatrix, setIsAsIsMatrix] = useState(true)

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
        individual: task.individual,
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
      trainedWorkforce: "",
      risks: [] as Risk[],
      individual: "",
      supervisor: "",
      status: "Active",
      location: "",
      geoFenceLimit: 200,
    }
  })

  // Convert API risks to local format
  const convertApiRisksToLocal = (apiRisks: TaskHazard['risks']): Risk[] => {
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

  const getLocation = () => {
    setIsLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            
            const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
            setFormData(prev => ({...prev, location: coords}));

            // TODO: Reimplement OpenCage API to get location name, if needed
            // const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
            // if (!apiKey) {
            //   throw new Error("OpenCage API key is not configured");
            // }

            // const response = await fetch(
            //   `https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=${apiKey}`
            // );

            // if (!response.ok) {
            //   throw new Error("Failed to fetch location data");
            // }

            // const data = await response.json();
            
            // if (data.results && data.results.length > 0) {
            //   const locationName = data.results[0].formatted;
            //   setFormData(prev => ({...prev, location: locationName}));
            // } else {
            //   // Fallback to coordinates if no formatted address is found
            //   const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
            //   setFormData(prev => ({...prev, location: coords}));
            // }
          } catch (error) {
            console.error("Error getting location name:", error);
            toast({
              title: "Warning",
              description: "Could not get address. Using coordinates instead.",
              variant: "default",
            });
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Failed to get location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Please enable location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "Please enter manually.";
          }
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported in your browser.",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
    }
  };

  // Handle map click to set location
  const handleMapClick = (event: MapMouseEvent) => {
    if (event.detail?.latLng) {
      const newLocation = {
        lat: event.detail.latLng.lat,
        lng: event.detail.latLng.lng,
      }
      setSelectedMapLocation(newLocation)
      // Update the location field with coordinates
      const coords = `${newLocation.lat}, ${newLocation.lng}`
      setFormData(prev => ({...prev, location: coords}))
    }
  }

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
        individual: task.individual,
        supervisor: task.supervisor,
        status: task.status,
        location: task.location,
        geoFenceLimit: task.geoFenceLimit || 200,
      })
      const [lat, lng] = task.location.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedMapLocation({ lat, lng });
      }
      setOpenGeoFence(false);
    }
  }, [mode, task])

  const setGeoFenceLimit = (limit: number) => {
    setFormData(prev => ({...prev, geoFenceLimit: limit}))
  }



  
  // Fetch supervisors when component mounts
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        setIsLoadingSupervisors(true)
        setIsLoadingUsers(true)
        const response = await userApi.getAll()
        // Filter users to only include supervisors
        const supervisorUsers = response.data.filter(user => user.role === 'supervisor')
        setUsers(response.data)
        setSupervisors(supervisorUsers)
      } catch (error) {
        console.error('Error fetching supervisors:', error)
        toast({
          title: "Error",
          description: "Failed to load supervisors. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingSupervisors(false)
        setIsLoadingUsers(false)
      }
    }

    fetchSupervisors()
  }, [toast])

  // Set current date/time when opening in create mode
  useEffect(() => {
    if (open && mode === 'create') {
      const now = new Date()
      const currentDate = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().slice(0, 5)
      setFormData(prev => ({
        ...prev,
        date: currentDate,
        time: currentTime
      }))
    }
  }, [open, mode])

  //TODO: REMOVE THIS
  // Listen for geo fence limit updates
  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     if (event.data.type === 'geoFenceUpdate') {
  //       setFormData(prev => ({
  //         ...prev,
  //         geoFenceLimit: event.data.limit
  //       }));
  //       onUpdateGeoFenceLimit?.(event.data.limit);
  //     } else if (event.data.type === 'requestInitialGeoFenceLimit') {
  //       // Send the current geo fence limit to the settings window
  //       if (event.source && 'postMessage' in event.source) {
  //         (event.source as Window).postMessage({
  //           type: 'initialGeoFenceLimit',
  //           limit: formData.geoFenceLimit || 200
  //         }, '*');
  //       }
  //     }
  //   };

  //   window.addEventListener('message', handleMessage);
  //   return () => window.removeEventListener('message', handleMessage);
  // }, [formData.geoFenceLimit, onUpdateGeoFenceLimit]);

  // Update map location when form location changes (for manual entry or GPS)
  useEffect(() => {
    if (formData.location && typeof formData.location === 'string') {
      const [lat, lng] = formData.location.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedMapLocation({ lat, lng });
      }
    }
  }, [formData.location]);



  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.date) errors.date = "Date is required";
    if (!formData.time) errors.time = "Time is required";
    if (!formData.scopeOfWork?.trim()) errors.scopeOfWork = "Scope of work is required";
    if (!formData.assetSystem) errors.assetSystem = "Asset system is required";
    if (!formData.individual) errors.individual = "Individual/Team is required";
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
    return Object.keys(errors).length === 0;
  };


  // Calculate risk score for display
  const calculateRiskScore = (risk: Risk, isAsIs: boolean = true) => {
    const likelihood = isAsIs ? risk.asIsLikelihood : risk.mitigatedLikelihood;
    const consequence = isAsIs ? risk.asIsConsequence : risk.mitigatedConsequence;
    
    if (!likelihood || !consequence || !risk.riskType) return null;
    
    return getRiskScore(likelihood, consequence, getConsequenceLabels(risk.riskType));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if any risks require supervisor signature
      const requiresSupervisorApproval = formData.risks.some(risk => risk.requiresSupervisorSignature);
      
      const formattedData = {
        ...formData,
        status: requiresSupervisorApproval ? 'Pending' : 'Active',
        risks: formData.risks.map(risk => ({
          id: risk.id || "",
          riskDescription: risk.riskDescription || "",
          riskType: risk.riskType || "",
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
        await taskHazardApi.createTaskHazard(createData);
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
        await taskHazardApi.updateTaskHazard(taskId, formattedData);
        toast({
          title: "Success",
          description: requiresSupervisorApproval 
            ? "Task hazard assessment has been updated and is pending supervisor approval."
            : "Task hazard assessment has been updated successfully.",
          variant: "default",
        })
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
    const newRisk: Risk = {
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

  const updateRisk = (riskId: string, updates: Partial<Risk>) => {
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

  const handleRiskUpdate = (riskId: string, updates: Partial<Risk>) => {
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
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Task Hazard Assessment' : 'Edit Task Hazard Assessment'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                className={validationErrors.date ? "border-red-500" : ""}
              />
              {validationErrors.date && (
                <span className="text-red-500 text-xs">{validationErrors.date}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({...prev, time: e.target.value}))}
                className={validationErrors.time ? "border-red-500" : ""}
              />
              {validationErrors.time && (
                <span className="text-red-500 text-xs">{validationErrors.time}</span>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="scopeOfWork">Scope of Work *</Label>
              <Input
                id="scopeOfWork"
                value={formData.scopeOfWork}
                onChange={(e) => setFormData(prev => ({...prev, scopeOfWork: e.target.value}))}
                placeholder="Enter scope of work"
                className={validationErrors.scopeOfWork ? "border-red-500" : ""}
              />
              {validationErrors.scopeOfWork && (
                <span className="text-red-500 text-xs">{validationErrors.scopeOfWork}</span>
              )}
            </div>
            <div className="col-span-2">
              <AssetSelector
                value={formData.assetSystem}
                onValueChange={(assetId) => setFormData(prev => ({...prev, assetSystem: assetId}))}
                error={validationErrors.assetSystem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemLockout">System Lockout Required</Label>
              <select
                id="systemLockout"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.systemLockoutRequired.toString()}
                onChange={(e) => setFormData(prev => ({...prev, systemLockoutRequired: e.target.value === 'true'}))}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainedWorkforce">Trained Workforce</Label>
              <Input
                id="trainedWorkforce"
                value={formData.trainedWorkforce}
                onChange={(e) => setFormData(prev => ({...prev, trainedWorkforce: e.target.value}))}
                placeholder="Enter trained workforce"
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
            <div className="space-y-2">
              <Label htmlFor="geoFence">Geo Fence Settings</Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex justify-between items-center"
                  onClick={() => setOpenGeoFence(true)}
                >
                  <span>Configure Geo Fence Limit</span>
                  <span className="text-sm text-gray-500">
                    Current: {formData.geoFenceLimit || 200} Feet
                  </span>
                </Button>
              </div>
            </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="individual">Individual/Team *</Label>
              <Select
                value={formData.individual || ""}
                onValueChange={(value) => setFormData(prev => ({...prev, individual: value}))}
              >
                <SelectTrigger className={validationErrors.individual ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select individual/team" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUsers ? (
                    <SelectItem value="loading" disabled>Loading users...</SelectItem>
                  ) : users.length === 0 ? (
                    <SelectItem value="none" disabled>No users found</SelectItem>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.email} ({user.role})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {validationErrors.individual && (
                <span className="text-red-500 text-xs">{validationErrors.individual}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor">Supervisor *</Label>
              <Select
                value={formData.supervisor || ""}
                onValueChange={(value) => setFormData(prev => ({...prev, supervisor: value}))}
              >
                <SelectTrigger className={validationErrors.supervisor ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSupervisors ? (
                    <SelectItem value="loading" disabled>Loading supervisors...</SelectItem>
                  ) : supervisors.length === 0 ? (
                    <SelectItem value="none" disabled>No supervisors found</SelectItem>
                  ) : (
                    supervisors.map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.email}>
                        {supervisor.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {validationErrors.supervisor && (
                <span className="text-red-500 text-xs">{validationErrors.supervisor}</span>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">Location *</Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                  placeholder="Enter location or click on map"
                  className={`flex-1 ${validationErrors.location ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getLocation}
                  disabled={isLoadingLocation}
                  className="px-3"
                >
                  {isLoadingLocation ? "..." : "📍"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMap(!showMap)}
                  className="px-3"
                >
                  🗺️
                </Button>
              </div>
              {showMap && (
                <div className="space-y-2">
                  <Label>Select Location on Map</Label>
                  <div className="border rounded-lg p-2 overflow-hidden">
                    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                      <Map
                        style={{ width: '100%', height: '300px' }}
                        defaultZoom={8}
                        defaultCenter={selectedMapLocation}
                        onClick={handleMapClick}
                        mapId="task-hazard-form-map"
                      >
                        <AdvancedMarker
                          position={selectedMapLocation}
                        />
                      </Map>
                    </APIProvider>
                  </div>
                </div>
              )}
              {validationErrors.location && (
                <span className="text-red-500 text-xs">{validationErrors.location}</span>
              )}
            </div>
            {mode === 'edit' && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            )}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label>Risks and Controls *</Label>
                {validationErrors.risks && (
                  <div className="text-red-500 text-xs mt-1">{validationErrors.risks}</div>
                )}
              </div>
              <Button 
                type="button"
                onClick={addRisk}
                className="bg-[#00A3FF] hover:bg-[#00A3FF]/90"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Risk
              </Button>
            </div>
            
            {formData.risks.map((risk, index) => {
              const asIsScore = calculateRiskScore(risk, true);
              const mitigatedScore = calculateRiskScore(risk, false);
              
              return (
                <div key={risk.id} className="border rounded-lg p-4 space-y-4 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => risk.id && removeRisk(risk.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Risk Description *</Label>
                      <Input
                        value={risk.riskDescription || ""}
                        onChange={(e) => risk.id && updateRisk(risk.id, { riskDescription: e.target.value })}
                        placeholder="E.g., Risk of pinch point"
                        className={validationErrors[`risk_${index}_description`] ? "border-red-500" : ""}
                      />
                      {validationErrors[`risk_${index}_description`] && (
                        <span className="text-red-500 text-xs">{validationErrors[`risk_${index}_description`]}</span>
                      )}
                    </div>
                    
                    <div>
                      <Label>Risk Type *</Label>
                      <Select
                        value={risk.riskType || ""}
                        onValueChange={(value) => risk.id && updateRisk(risk.id, { riskType: value })}
                      >
                        <SelectTrigger className={validationErrors[`risk_${index}_type`] ? "border-red-500" : ""}>
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
                      <Label>Associated Risks</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => risk.id && openRiskMatrix(risk.id, true)}
                      >
                        {asIsScore !== null ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded ${getRiskColor(asIsScore, risk.riskType || '')}`}>
                              {risk.asIsLikelihood} x {risk.asIsConsequence}
                            </span>
                            <span className="text-gray-500">= Score {asIsScore}</span>
                          </div>
                        ) : (
                          <div className="text-gray-500">Not assessed</div>
                        )}
                      </Button>
                    </div>
                    
                    <div className="col-span-2">
                      <Label>Mitigating Action *</Label>
                      <Input
                        value={risk.mitigatingAction || ""}
                        onChange={(e) => risk.id && updateRisk(risk.id, { mitigatingAction: e.target.value })}
                        placeholder="E.g., Wear gloves"
                        className={validationErrors[`risk_${index}_mitigation`] ? "border-red-500" : ""}
                      />
                      {validationErrors[`risk_${index}_mitigation`] && (
                        <span className="text-red-500 text-xs">{validationErrors[`risk_${index}_mitigation`]}</span>
                      )}
                    </div>
                    
                    <div>
                      <Label>Mitigating Action Type</Label>
                      <Select
                        value={risk.mitigatingActionType || ""}
                        onValueChange={(value) => risk.id && updateRisk(risk.id, { mitigatingActionType: value })}
                      >
                        <SelectTrigger>
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
                      <Label>Post-Mitigation Risk Assessment</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => risk.id && openRiskMatrix(risk.id, false)}
                      >
                        {mitigatedScore !== null ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded ${getRiskColor(mitigatedScore, risk.riskType || '')}`}>
                              {risk.mitigatedLikelihood} x {risk.mitigatedConsequence}
                            </span>
                            <span className="text-gray-500">= Score {mitigatedScore}</span>
                          </div>
                        ) : (
                          <div className="text-gray-500">Not assessed</div>
                        )}
                      </Button>
                      {risk.requiresSupervisorSignature && (
                        <div className="mt-2">
                          <span className="text-amber-600 text-xs">⚠️ Supervisor signature required - Status will remain pending until approved</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#00A3FF] hover:bg-[#00A3FF]/90" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Add Task' : 'Save Changes'
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
        risk={formData.risks.find(r => r.id === activeRiskId) || null}
        onRiskUpdate={handleRiskUpdate}
      />
    </Dialog>
  )
} 