"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, X, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { useRouter } from "next/navigation"
import { taskHazardApi, assetHierarchyApi, type Asset } from "@/services/api"
import type { TaskHazard } from "@/services/api"
import { userApi } from "@/services/userApi"
import type { User } from "@/services/userApi"

// Define interface for risk (local version)
interface Risk {
  id: string;
  riskDescription: string;
  riskType: string;
  asIsLikelihood: string;
  asIsConsequence: string;
  mitigatingAction: string;
  mitigatedLikelihood: string;
  mitigatedConsequence: string;
  mitigatingActionType: string;
  requiresSupervisorSignature: boolean;
}

const riskCategories = [
  { id: "Personnel", label: "Personnel", color: "bg-[#00A3FF]" },
  { id: "Maintenance", label: "Maintenance", color: "bg-gray-200" },
  { id: "Revenue", label: "Revenue", color: "bg-gray-200" },
  { id: "Process", label: "Process", color: "bg-gray-200" },
  { id: "Environmental", label: "Environmental", color: "bg-gray-200" },
]

const personnelConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "No Lost Time", score: 1 },
  { value: "Significant", label: "Significant", description: "Lost Time", score: 2 },
  { value: "Serious", label: "Serious", description: "Short Term Disability", score: 3 },
  { value: "Major", label: "Major", description: "Long Term Disability", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: "Fatality", score: 5 },
]

const maintenanceConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "<5% Impact to Maintenance Budget", score: 1 },
  { value: "Significant", label: "Significant", description: "5-10% Impact to Maintenance Budget", score: 2 },
  { value: "Serious", label: "Serious", description: "20-30% Impact to Maintenance Budget", score: 3 },
  { value: "Major", label: "Major", description: "30-40% Impact to Maintenance Budget", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: ">41% Impact to Maintenance Budget", score: 5 },
]

const revenueConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "<2% Impact to Revenue", score: 1 },
  { value: "Significant", label: "Significant", description: "2-6% Impact to Revenue", score: 2 },
  { value: "Serious", label: "Serious", description: "6-12% Impact to Revenue", score: 3 },
  { value: "Major", label: "Major", description: "12-24% Impact to Revenue", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: ">25% Impact to Revenue", score: 5 },
]

const processConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "Production Loss < 10 Days", score: 1 },
  { value: "Significant", label: "Significant", description: "Production Loss 10 - 20 Days", score: 2 },
  { value: "Serious", label: "Serious", description: "Production Loss 20 - 40 Days", score: 3 },
  { value: "Major", label: "Major", description: "Production Loss 40 - 80 Days", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: "Production Loss >81 Days", score: 5 },
]

const environmentalConsequenceLabels = [
  { value: "Minor", label: "Minor", description: "Near Source - Non Reportable - Cleanup <1Shift", score: 1 },
  { value: "Significant", label: "Significant", description: "Near Source - Reportable - Cleanup <1Shift", score: 2 },
  { value: "Serious", label: "Serious", description: "Near Source - Reportable - Cleanup <4WKS", score: 3 },
  { value: "Major", label: "Major", description: "Near Source - Reportable - Cleanup <52WKS", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: "Near Source - Reportable - Cleanup <1WK", score: 5 },
]

const likelihoodLabels = [
  { value: "Very Unlikely", label: "Very Unlikely", description: "Once in Lifetime >75 Years", score: 1 },
  { value: "Slight Chance", label: "Slight Chance", description: "Once in 10 to 75 Years", score: 2 },
  { value: "Feasible", label: "Feasible", description: "Once in 10 Years", score: 3 },
  { value: "Likely", label: "Likely", description: "Once in 2 to 10 Years", score: 4 },
  { value: "Very Likely", label: "Very Likely", description: "Multiple times in 2 Years", score: 5 },
]

// Risk matrix scores based on the image
const riskMatrix = [
  // Minor (1), Significant (2), Serious (3), Major (4), Catastrophic (5)
  [1, 2, 3, 4, 5],    // Very Unlikely (1)
  [2, 4, 6, 8, 10],   // Slight Chance (2)
  [3, 6, 9, 12, 15],  // Feasible (3)
  [4, 8, 12, 16, 20], // Likely (4)
  [5, 10, 15, 20, 25] // Very Likely (5)
];

const getRiskScore = (likelihood: string, consequence: string, consequenceLabels: Array<{value: string, score: number}>) => {
  const likelihoodScore = likelihoodLabels.find(l => l.value === likelihood)?.score || 0;
  const consequenceScore = consequenceLabels.find(c => c.value === consequence)?.score || 0;
  
  if (likelihoodScore === 0 || consequenceScore === 0) return 0;
  
  return riskMatrix[likelihoodScore - 1][consequenceScore - 1];
};

const getRiskColor = (score: number, riskType: string) => {
  // For Maintenance Risk
  if (riskType === "Maintenance") {
    // Looking at the exact matrix:
    // Scores: 1, 2 are green
    if (score <= 2) return "bg-[#8DC63F] text-black";
    
    // Scores: 3, 4, 5, 6, 8, 9 are yellow
    if (score <= 9) return "bg-[#FFFF00] text-black";
    
    // Scores: 10, 12 are orange
    if (score <= 12) return "bg-[#F7941D] text-white";
    
    // Scores: 15 is orange
    if (score === 15) return "bg-[#F7941D] text-white";
    
    // Scores: 16, 20, 25 are red
    return "bg-[#ED1C24] text-white";
  }

  if (riskType === "Personnel") {
    // Scores: 1-2 are green
    if (score <= 2) return "bg-[#8DC63F] text-black";
    
    // Scores: 3-4 are yellow
    if (score <= 9) return "bg-[#FFFF00] text-black";

    // Scores: 5-10 are orange
    if (score <= 15) return "bg-[#F7941D] text-white";

    // Scores: 12-25 are red
    return "bg-[#ED1C24] text-white";
  }

  if (riskType === "Revenue") {
    // Scores: 1-2 are green
    if (score <= 2) return "bg-[#8DC63F] text-black";

    // Scores: 3-6 are yellow
    if (score <= 9) return "bg-[#FFFF00] text-black";

    // Scores: 7-8 are orange
    if (score <= 15) return "bg-[#F7941D] text-white";

    // Scores: 12-25 are red
    return "bg-[#ED1C24] text-white";
  }

  if (riskType === "Process") {
     // Scores: 1-2 are green
     if (score <= 2) return "bg-[#8DC63F] text-black";

     // Scores: 3-6 are yellow
     if (score <= 9) return "bg-[#FFFF00] text-black";
 
     // Scores: 7-8 are orange
     if (score <= 15) return "bg-[#F7941D] text-white";
 
     // Scores: 12-25 are red
     return "bg-[#ED1C24] text-white";
  }

  if (riskType === "Environmental") {
   // Scores: 1-2 are green
   if (score <= 2) return "bg-[#8DC63F] text-black";

   // Scores: 3-6 are yellow
   if (score <= 9) return "bg-[#FFFF00] text-black";

   // Scores: 7-8 are orange
   if (score <= 15) return "bg-[#F7941D] text-white";

   // Scores: 12-25 are red
   return "bg-[#ED1C24] text-white";
  }
  
  // For Personnel Risk and other types
  // Green (1-2)
  if (score <= 2) return "bg-[#8DC63F] text-black";
  
  // Yellow (3-4)
  if (score <= 4) return "bg-[#FFFF00] text-black";
  
  // Orange (5-10)
  if (score <= 10) return "bg-[#F7941D] text-white";
  
  // Red (12-25)
  return "bg-[#ED1C24] text-white";
}

// Define risk level indicators for each risk type
const riskLevelIndicators = {
  Personnel: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
  Maintenance: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
  Revenue: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
  Process: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
  Environmental: [
    { color: "bg-[#8DC63F]", label: "Low Risk (1-2)", textColor: "text-black" },
    { color: "bg-[#FFFF00]", label: "Medium Risk (3-9)", textColor: "text-black" },
    { color: "bg-[#F7941D]", label: "High Risk (10-15)", textColor: "text-white" },
    { color: "bg-[#ED1C24]", label: "Critical Risk (16-25)", textColor: "text-white" },
  ],
};

// Define interface for task data
type TaskHazardData = TaskHazard;

export default function TaskHazard() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false)
  const assetDropdownRef = React.useRef<HTMLDivElement>(null)
  const [searchAsset, setSearchAsset] = useState("")
  const [showRiskMatrix, setShowRiskMatrix] = useState(false)
  const [activeRiskId, setActiveRiskId] = useState<string | null>(null)
  const [isAsIsMatrix, setIsAsIsMatrix] = useState(true)
  const [enableSupervisorSignature, setEnableSupervisorSignature] = useState(true)
  const [expandedAssets, setExpandedAssets] = useState<string[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(true)
  const [assetError, setAssetError] = useState<string | null>(null)
  const [activeConsequenceLabels, setActiveConsequenceLabels] = useState(personnelConsequenceLabels)
  const [isEditMode, setIsEditMode] = useState(false)
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  
  const [newTask, setNewTask] = useState({
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
  })

  // Add state for API data
  const [tasks, setTasks] = useState<TaskHazardData[]>([])
  console.log("tasks", tasks)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editTask, setEditTask] = useState<TaskHazardData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  
  // Define fetchTasks function outside of useEffect so it can be reused
  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const response = await taskHazardApi.getTaskHazards()
      
      // Check if response has the expected structure with data property
      if (response && response.status && Array.isArray(response.data)) {
        setTasks(response.data)
      } else {
        // Fallback if the response structure is unexpected
        setTasks([])
      }
      
      setError(null)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Failed to load tasks. Please try again later.")
      // Set tasks to empty array on error
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch all tasks when component mounts
  useEffect(() => {
    fetchTasks()
  }, [])

  // Fetch assets when component mounts
  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      setIsLoadingAssets(true)
      setAssetError(null)
      const response = await assetHierarchyApi.getAll()
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from server')
      }

      setAssets(response.data)
      
      // Expand root level assets by default
      const rootAssets = response.data
        .filter(asset => asset.level === 0)
        .map(asset => asset.id)
      setExpandedAssets(rootAssets)
    } catch (err) {
      console.error('Error fetching assets:', err)
      setAssetError('Failed to load assets. Please try again later.')
    } finally {
      setIsLoadingAssets(false)
    }
  }

  // Update consequence labels when risk type changes
  React.useEffect(() => {
    if (activeRiskId) {
      const activeRisk = newTask.risks.find(r => r.id === activeRiskId);
      if (activeRisk) {
        switch (activeRisk.riskType) {
          case "Maintenance":
            setActiveConsequenceLabels(maintenanceConsequenceLabels);
            break;
          case "Personnel":
            setActiveConsequenceLabels(personnelConsequenceLabels);
            break;
          case "Revenue":
            setActiveConsequenceLabels(revenueConsequenceLabels);
            break;
          case "Process":
            setActiveConsequenceLabels(processConsequenceLabels);
            break;
          case "Environmental":
            setActiveConsequenceLabels(environmentalConsequenceLabels);
            break;
          default:
            setActiveConsequenceLabels(personnelConsequenceLabels);
            break;
        }
      }
    }
  }, [activeRiskId, newTask.risks]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assetDropdownRef.current && !assetDropdownRef.current.contains(event.target as Node)) {
        setAssetDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter assets based on search term
  const filteredAssets = searchAsset.trim() === "" 
    ? assets 
    : assets.filter(asset => 
        asset.name.toLowerCase().includes(searchAsset.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchAsset.toLowerCase())
      )

  // Expand parents of matching assets when searching
  React.useEffect(() => {
    if (searchAsset.trim() !== "") {
      // Find all matching assets
      const matchingAssets = filteredAssets;
      
      // Collect all parent IDs that need to be expanded
      const parentsToExpand = new Set<string>();
      
      matchingAssets.forEach(asset => {
        let currentParent = asset.parent;
        while (currentParent) {
          parentsToExpand.add(currentParent);
          const parentAsset = assets.find(a => a.id === currentParent);
          currentParent = parentAsset?.parent || null;
        }
      });
      
      // Update expanded assets
      setExpandedAssets(prev => {
        const newExpanded = [...prev];
        parentsToExpand.forEach(id => {
          if (!newExpanded.includes(id)) {
            newExpanded.push(id);
          }
        });
        return newExpanded;
      });
    }
  }, [searchAsset, filteredAssets, assets]);

  // Highlight matching text in search results
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-200">{part}</span> : part
    );
  };

  // Get top-level assets (those with no parent or parent is null)
  const getTopLevelAssets = () => {
    return filteredAssets.filter(asset => asset.parent === null);
  }

  // Get child assets for a given parent ID
  const getChildAssets = (parentId: string) => {
    return filteredAssets.filter(asset => asset.parent === parentId);
  }

  // Toggle expanded state for an asset
  const toggleAssetExpanded = (assetId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedAssets(prev => 
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Check if an asset is expanded
  const isAssetExpanded = (assetId: string) => {
    return expandedAssets.includes(assetId);
  }

  // Expand parent assets of the selected asset when the component is first loaded
  const expandParentAssets = React.useCallback((assetId: string) => {
    const currentAsset = assets.find(a => a.id === assetId);
    if (!currentAsset) return;
    
    const parentIds: string[] = [];
    let currentParent = currentAsset.parent;
    
    while (currentParent) {
      parentIds.push(currentParent);
      const parentAsset = assets.find(a => a.id === currentParent);
      currentParent = parentAsset?.parent || null;
    }
    
    if (parentIds.length > 0) {
      setExpandedAssets(prev => {
        const newExpanded = [...prev];
        parentIds.forEach(id => {
          if (!newExpanded.includes(id)) {
            newExpanded.push(id);
          }
        });
        return newExpanded;
      });
    }
  }, [assets]);

  React.useEffect(() => {
    if (newTask.assetSystem) {
      expandParentAssets(newTask.assetSystem);
    }
  }, [expandParentAssets, newTask.assetSystem]);

  // Update the asset system selection handler
  const handleAssetSelection = (assetId: string) => {
    setNewTask({...newTask, assetSystem: assetId})
    expandParentAssets(assetId)
    setAssetDropdownOpen(false)
  }

  // Render asset hierarchy recursively
  const renderAssetHierarchy = (assets: Asset[]) => {
    return assets.map(asset => {
      const children = getChildAssets(asset.id)
      const hasChildren = children.length > 0
      const isExpanded = isAssetExpanded(asset.id)
      
      return (
        <div key={asset.id} className="w-full">
          <div 
            className={`flex items-center py-2 px-2 hover:bg-gray-100 cursor-pointer ${newTask.assetSystem === asset.id ? 'bg-blue-50' : ''}`}
            style={{ paddingLeft: `${asset.level * 16 + 8}px` }}
            onClick={(e) => {
              e.stopPropagation()
              handleAssetSelection(asset.id)
            }}
          >
            {hasChildren && (
              <button
                type="button"
                className="mr-2 text-gray-500 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleAssetExpanded(asset.id, e)
                }}
              >
                {isExpanded ? '▼' : '►'}
              </button>
            )}
            {!hasChildren && <span className="w-4 mr-2"></span>}
            <div className="flex items-center">
              <span className="font-medium min-w-[100px]">
                {typeof highlightMatch(asset.name, searchAsset) === 'string' 
                  ? asset.name 
                  : highlightMatch(asset.name, searchAsset)}
              </span>
              <span className="ml-2 text-gray-600 text-sm">
                {typeof highlightMatch(asset.description, searchAsset) === 'string' 
                  ? asset.description 
                  : highlightMatch(asset.description, searchAsset)}
              </span>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="border-l border-gray-200 ml-4">
              {renderAssetHierarchy(children)}
            </div>
          )}
        </div>
      )
    })
  }

  // Function to set current date and time
  const setCurrentDateTime = () => {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    setNewTask(prev => ({
      ...prev,
      date: currentDate,
      time: currentTime
    }))
  }

  // Update Dialog to set date/time when opened
  const handleDialogChange = (newOpenState: boolean) => {
    setOpen(newOpenState)
    if (newOpenState) {
      setCurrentDateTime()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Check if any risks require supervisor signature
      const requiresSupervisorApproval = newTask.risks.some(risk => risk.requiresSupervisorSignature);
      
      // Format the data according to API requirements
      const formattedTask: Omit<TaskHazardData, 'id'> = {
        date: newTask.date,
        time: newTask.time,
        scopeOfWork: newTask.scopeOfWork,
        assetSystem: newTask.assetSystem,
        systemLockoutRequired: newTask.systemLockoutRequired,
        trainedWorkforce: newTask.trainedWorkforce,
        individual: newTask.individual,
        supervisor: newTask.supervisor,
        location: newTask.location,
        geoFenceLimit: newTask.geoFenceLimit,
        status: requiresSupervisorApproval ? 'Pending' : 'Active',
        risks: newTask.risks.map(risk => ({
          id: risk.id,
          riskDescription: risk.riskDescription,
          riskType: risk.riskType,
          asIsLikelihood: risk.asIsLikelihood || "",
          asIsConsequence: risk.asIsConsequence || "",
          mitigatingAction: risk.mitigatingAction || "",
          mitigatingActionType: risk.mitigatingActionType || "",
          mitigatedLikelihood: risk.mitigatedLikelihood || "",
          mitigatedConsequence: risk.mitigatedConsequence || "",
          requiresSupervisorSignature: risk.requiresSupervisorSignature || false
        }))
      };
      
      // Use the API service instead of direct fetch
      await taskHazardApi.createTaskHazard(formattedTask);
      
      toast({
        title: "Success",
        description: requiresSupervisorApproval 
          ? "Task hazard assessment has been created and is pending supervisor approval."
          : "Task hazard assessment has been created successfully.",
        variant: "default",
      })
      
      setOpen(false)
      fetchTasks()
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task hazard assessment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addNewRisk = () => {
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
    setNewTask({
      ...newTask,
      risks: [...newTask.risks, newRisk]
    })
  }

  const updateRisk = (riskId: string, updates: Partial<Risk>) => {
    setNewTask({
      ...newTask,
      risks: newTask.risks.map(risk => 
        risk.id === riskId ? { ...risk, ...updates } : risk
      )
    })
  }

  const removeRisk = (riskId: string) => {
    setNewTask({
      ...newTask,
      risks: newTask.risks.filter(risk => risk.id !== riskId)
    })
  }

  const openRiskMatrix = (riskId: string, isAsIs: boolean, isEdit: boolean = false) => {
    setActiveRiskId(riskId);
    setIsAsIsMatrix(isAsIs);
    setIsEditMode(isEdit);
    setShowRiskMatrix(true);
  }

  const openGeoFenceSettings = (isNewTask: boolean) => {
    // Use query parameters instead of dynamic routes
    const url = `/safety/geo-fence-settings?mode=${isNewTask ? 'new' : 'edit'}&limit=${isNewTask ? newTask.geoFenceLimit : editTask?.geoFenceLimit || 200}`;
    
    // Open in a new tab
    const newWindow = window.open(url, '_blank', 'width=600,height=400');

    // Add event listener for messages from the geo fence settings page
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'geoFenceUpdate') {
        if (isNewTask) {
          setNewTask(prev => ({
            ...prev,
            geoFenceLimit: event.data.limit
          }));
        } else if (editTask) {
          setEditTask({
            ...editTask,
            geoFenceLimit: event.data.limit
          });
        }
        // Remove the event listener after receiving the update
        window.removeEventListener('message', handleMessage);
      } else if (event.data.type === 'requestInitialGeoFenceLimit') {
        // Send the current geo fence limit to the settings window
        if (event.source && 'postMessage' in event.source) {
          (event.source as Window).postMessage({
            type: 'initialGeoFenceLimit',
            limit: isNewTask ? newTask.geoFenceLimit : editTask?.geoFenceLimit || 200
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Clean up event listener when the window closes
    const checkWindow = setInterval(() => {
      if (newWindow?.closed) {
        window.removeEventListener('message', handleMessage);
        clearInterval(checkWindow);
      }
    }, 1000);
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return

    try {
      await taskHazardApi.deleteTaskHazard(deleteTaskId)
      
      toast({
        title: "Success",
        description: "Task hazard assessment has been deleted successfully.",
        variant: "default",
      })
      
      // Refresh tasks list
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task hazard assessment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteTaskId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTask) return;

    try {
      // Check if any risks require supervisor signature
      const requiresSupervisorApproval = editTask.risks.some(risk => risk.requiresSupervisorSignature);
      
      // Simple status logic: if requires approval -> Pending, otherwise always Active
      const newStatus = requiresSupervisorApproval ? 'Pending' : 'Active';
      
      const formattedTask = {
        ...editTask,
        status: newStatus,
        risks: (editTask.risks || []).map(risk => ({
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
      
      if (!formattedTask.id) {
        throw new Error('Task ID is required');
      }
      
      await taskHazardApi.updateTaskHazard(formattedTask.id, formattedTask);
      
      toast({
        title: "Success",
        description: requiresSupervisorApproval 
          ? "Task hazard assessment has been updated and is pending supervisor approval."
          : "Task hazard assessment has been updated successfully.",
        variant: "default",
      })
      
      // Refresh tasks list
      fetchTasks();
      setIsEditDialogOpen(false);
      setEditTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task hazard assessment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add functions for managing risks in edit mode
  const addEditRisk = () => {
    if (!editTask) return
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
    setEditTask({
      ...editTask,
      risks: [...(editTask.risks || []).map(risk => ({
        id: risk.id || "",
        riskDescription: risk.riskDescription || "",
        riskType: risk.riskType || "",
        asIsLikelihood: risk.asIsLikelihood || "",
        asIsConsequence: risk.asIsConsequence || "",
        mitigatingAction: risk.mitigatingAction || "",
        mitigatedLikelihood: risk.mitigatedLikelihood || "",
        mitigatedConsequence: risk.mitigatedConsequence || "",
        mitigatingActionType: risk.mitigatingActionType || "",
        requiresSupervisorSignature: risk.requiresSupervisorSignature || false,
      })), newRisk]
    })
  }

  const updateEditRisk = (riskId: string, updates: Partial<Risk>) => {
    if (!editTask) return
    setEditTask({
      ...editTask,
      risks: (editTask.risks || []).map(risk => 
        risk.id === riskId ? { 
          id: risk.id || "",
          riskDescription: risk.riskDescription || "",
          riskType: risk.riskType || "",
          asIsLikelihood: risk.asIsLikelihood || "",
          asIsConsequence: risk.asIsConsequence || "",
          mitigatingAction: risk.mitigatingAction || "",
          mitigatedLikelihood: risk.mitigatedLikelihood || "",
          mitigatedConsequence: risk.mitigatedConsequence || "",
          mitigatingActionType: risk.mitigatingActionType || "",
          requiresSupervisorSignature: risk.requiresSupervisorSignature || false,
          ...updates 
        } : {
          id: risk.id || "",
          riskDescription: risk.riskDescription || "",
          riskType: risk.riskType || "",
          asIsLikelihood: risk.asIsLikelihood || "",
          asIsConsequence: risk.asIsConsequence || "",
          mitigatingAction: risk.mitigatingAction || "",
          mitigatedLikelihood: risk.mitigatedLikelihood || "",
          mitigatedConsequence: risk.mitigatedConsequence || "",
          mitigatingActionType: risk.mitigatingActionType || "",
          requiresSupervisorSignature: risk.requiresSupervisorSignature || false,
        }
      )
    })
  }

  const removeEditRisk = (riskId: string) => {
    if (!editTask) return
    setEditTask({
      ...editTask,
      risks: (editTask.risks || []).filter(risk => risk.id === riskId).map(risk => ({
        id: risk.id || "",
        riskDescription: risk.riskDescription || "",
        riskType: risk.riskType || "",
        asIsLikelihood: risk.asIsLikelihood || "",
        asIsConsequence: risk.asIsConsequence || "",
        mitigatingAction: risk.mitigatingAction || "",
        mitigatedLikelihood: risk.mitigatedLikelihood || "",
        mitigatedConsequence: risk.mitigatedConsequence || "",
        mitigatingActionType: risk.mitigatingActionType || "",
        requiresSupervisorSignature: risk.requiresSupervisorSignature || false,
      }))
    })
  }

  const getLocation = () => {
    setIsLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
            if (!apiKey) {
              throw new Error("OpenCage API key is not configured");
            }

            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=${apiKey}`
            );

            if (!response.ok) {
              throw new Error("Failed to fetch location data");
            }

            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              const locationName = data.results[0].formatted;
              if (editTask) {
                setEditTask({...editTask, location: locationName});
              } else {
                setNewTask({...newTask, location: locationName});
              }
            } else {
              // Fallback to coordinates if no formatted address is found
              const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
              if (editTask) {
                setEditTask({...editTask, location: coords});
              } else {
                setNewTask({...newTask, location: coords});
              }
            }
          } catch (error) {
            console.error("Error getting location name:", error);
            toast({
              title: "Warning",
              description: "Could not get address. Using coordinates instead.",
              variant: "default",
            });
            // Fallback to coordinates
            const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
            if (editTask) {
              setEditTask({...editTask, location: coords});
            } else {
              setNewTask({...newTask, location: coords});
            }
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

  // Fetch supervisors when component mounts
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        setIsLoadingSupervisors(true)
        const response = await userApi.getAll()
        // Filter users to only include supervisors
        const supervisorUsers = response.data.filter(user => user.role === 'supervisor')
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
      }
    }

    fetchSupervisors()
  }, [toast])

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const response = await userApi.getAll()
        setUsers(response.data)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast({
          title: "Error",
          description: "Failed to load users. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [toast])

  // Make sure the handleRiskMatrixClick function passes the correct format of values
  const handleRiskMatrixClick = (likelihood: string, consequence: string, score: number) => {
    // Get the current risk
    const currentRisk = isEditMode
      ? editTask?.risks?.find(r => r.id === activeRiskId)
      : newTask.risks.find(r => r.id === activeRiskId);

    console.log('Current Risk:', currentRisk);
    console.log('Score:', score);

    if (!currentRisk) return;

    // Create updates based on whether it's as-is or mitigated
    const updates: Partial<Risk> = isAsIsMatrix
      ? { 
          asIsLikelihood: likelihood,
          asIsConsequence: consequence,
        }
      : {
          mitigatedLikelihood: likelihood,
          mitigatedConsequence: consequence,
          requiresSupervisorSignature: (currentRisk.riskType === "Maintenance")
            ? enableSupervisorSignature && score >= 16
            : enableSupervisorSignature && score > 9
        };

    console.log('Risk Updates:', updates);

    // Update the appropriate state
    if (isEditMode && editTask) {
      // First update the risk
      updateEditRisk(activeRiskId!, updates);
      
      if (!isAsIsMatrix) {
        // After updating the risk, check if any risks now require supervisor signature
        const updatedRisks = editTask.risks.map(risk => 
          risk.id === activeRiskId 
            ? { ...risk, ...updates }
            : risk
        );
        
        const requiresApproval = updatedRisks.some(risk => risk.requiresSupervisorSignature);        
        // Update the task with new risks and status
        setEditTask(prev => {
          const newState = {
            ...prev!,
            risks: updatedRisks,
            // If any risk requires signature -> Pending, otherwise always Active
            status: requiresApproval ? 'Pending' : 'Active'
          };
          return newState;
        });
      }
    } else {
      // First update the risk
      updateRisk(activeRiskId!, updates);
      
      if (!isAsIsMatrix) {
        // After updating the risk, check if any risks now require supervisor signature
        const updatedRisks = newTask.risks.map(risk => 
          risk.id === activeRiskId 
            ? { ...risk, ...updates }
            : risk
        );
        
        const requiresApproval = updatedRisks.some(risk => risk.requiresSupervisorSignature);
        
        // Update the task with new risks and status
        setNewTask(prev => {
          const newState = {
            ...prev,
            risks: updatedRisks,
            // If any risk requires signature -> Pending, otherwise always Active
            status: requiresApproval ? 'Pending' : 'Active'
          };
          return newState;
        });
      }
    }

    setShowRiskMatrix(false);
  };

  // Add a function to log what we're sending to the API

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Task Hazard Assessment</h1>
        <div className="flex gap-4">
          <Input 
            className="w-[300px]" 
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 gap-2">
                <Plus className="h-4 w-4" /> ADD NEW
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Task Hazard Assessment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTask.date}
                      onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newTask.time}
                      onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="scopeOfWork">Scope of Work</Label>
                    <Input
                      id="scopeOfWork"
                      value={newTask.scopeOfWork}
                      onChange={(e) => setNewTask({...newTask, scopeOfWork: e.target.value})}
                      placeholder="Enter scope of work"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="assetSystem">Asset or System being worked on</Label>
                    <div className="relative" ref={assetDropdownRef}>
                      <div 
                        className="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 h-10 text-sm"
                        onClick={() => setAssetDropdownOpen(!assetDropdownOpen)}
                      >
                        {newTask.assetSystem ? (
                          <div className="flex items-center">
                            <span className="font-medium">
                              {assets.find(a => a.id === newTask.assetSystem)?.name}
                            </span>
                            <span className="ml-2 text-muted-foreground">
                              {assets.find(a => a.id === newTask.assetSystem)?.description}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select asset or system</span>
                        )}
                        <span className="text-gray-500">{assetDropdownOpen ? '▲' : '▼'}</span>
                      </div>
                      
                      {assetDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                          <div className="p-2 pb-0">
                            <Input
                              placeholder="Search assets..."
                              value={searchAsset}
                              onChange={(e) => setSearchAsset(e.target.value)}
                              className="mb-2"
                            />
                          </div>
                          <div className="max-h-[350px] overflow-y-auto">
                            {isLoadingAssets ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                Loading assets...
                              </div>
                            ) : assetError ? (
                              <div className="p-2 text-sm text-red-500 text-center">
                                {assetError}
                              </div>
                            ) : filteredAssets.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                No assets found
                              </div>
                            ) : (
                              <div className="asset-hierarchy">
                                {renderAssetHierarchy(getTopLevelAssets())}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemLockout">System Lockout Required</Label>
                    <select
                      id="systemLockout"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newTask.systemLockoutRequired.toString()}
                      onChange={(e) => setNewTask({...newTask, systemLockoutRequired: e.target.value === 'true'})}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainedWorkforce">Trained Workforce</Label>
                    <Input
                      id="trainedWorkforce"
                      value={newTask.trainedWorkforce}
                      onChange={(e) => setNewTask({...newTask, trainedWorkforce: e.target.value})}
                      placeholder="Enter trained workforce"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="geoFence">Geo Fence Settings</Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex justify-between items-center"
                        onClick={() => openGeoFenceSettings(true)}
                      >
                        <span>Configure Geo Fence Limit</span>
                        <span className="text-sm text-gray-500">
                          Current: {newTask.geoFenceLimit} Feet
                        </span>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="individual">Individual/Team</Label>
                    <Select
                      value={newTask.individual}
                      onValueChange={(value) => setNewTask({...newTask, individual: value})}
                    >
                      <SelectTrigger>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <Select
                      value={newTask.supervisor}
                      onValueChange={(value) => setNewTask({...newTask, supervisor: value})}
                    >
                      <SelectTrigger>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="flex gap-2">
                      <Input
                        id="location"
                        value={newTask.location}
                        onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                        placeholder="Enter location"
                        disabled={isLoadingLocation}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getLocation}
                        disabled={isLoadingLocation}
                      >
                        {isLoadingLocation ? "Getting Location..." : "Get Location"}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Risks and Controls</Label>
                    <Button 
                      type="button"
                      onClick={addNewRisk}
                      className="bg-[#00A3FF] hover:bg-[#00A3FF]/90"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Risk
                    </Button>
                  </div>
                  
                  {newTask.risks.map((risk) => (
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
                          <Label>Risk Description</Label>
                          <Input
                            value={risk.riskDescription}
                            onChange={(e) => risk.id && updateRisk(risk.id, { riskDescription: e.target.value })}
                            placeholder="E.g., Risk of pinch point"
                          />
                        </div>
                        
                        <div>
                          <Label>Risk Type</Label>
                          <Select
                            value={risk.riskType}
                            onValueChange={(value) => risk.id && updateRisk(risk.id, { riskType: value })}
                          >
                            <SelectTrigger>
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
                        </div>
                        
                        <div>
                          <Label>Associated Risks</Label>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => risk.id && openRiskMatrix(risk.id, true, false)}
                          >
                            {risk.asIsLikelihood && risk.asIsConsequence ? (
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded ${getRiskColor(
                                  getRiskScore(
                                    risk.asIsLikelihood,
                                    risk.asIsConsequence,
                                    (() => {
                                      switch (risk.riskType) {
                                        case "Maintenance": return maintenanceConsequenceLabels;
                                        case "Personnel": return personnelConsequenceLabels;
                                        case "Revenue": return revenueConsequenceLabels;
                                        case "Process": return processConsequenceLabels;
                                        case "Environmental": return environmentalConsequenceLabels;
                                        default: return personnelConsequenceLabels;
                                      }
                                    })()
                                  ),
                                  risk.riskType || ''
                                )}`}>
                                  {getRiskScore(
                                    risk.asIsLikelihood,
                                    risk.asIsConsequence,
                                    (() => {
                                      switch (risk.riskType) {
                                        case "Maintenance": return maintenanceConsequenceLabels;
                                        case "Personnel": return personnelConsequenceLabels;
                                        case "Revenue": return revenueConsequenceLabels;
                                        case "Process": return processConsequenceLabels;
                                        case "Environmental": return environmentalConsequenceLabels;
                                        default: return personnelConsequenceLabels;
                                      }
                                    })()
                                  )}
                                </span>
                                <span>{`${risk.asIsLikelihood} / ${risk.asIsConsequence}`}</span>
                              </div>
                            ) : (
                              'Select Risk Level'
                            )}
                          </Button>
                        </div>
                        
                        <div className="col-span-2">
                          <Label>Mitigating Action</Label>
                          <Input
                            value={risk.mitigatingAction}
                            onChange={(e) => risk.id && updateRisk(risk.id, { mitigatingAction: e.target.value })}
                            placeholder="E.g., Wear gloves"
                          />
                        </div>
                        
                        <div>
                          <Label>Mitigating Action Type</Label>
                          <Select
                            value={risk.mitigatingActionType}
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
                            onClick={() => risk.id && openRiskMatrix(risk.id, false, false)}
                          >
                            {risk.mitigatedLikelihood && risk.mitigatedConsequence ? (
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded ${getRiskColor(
                                  getRiskScore(
                                    risk.mitigatedLikelihood,
                                    risk.mitigatedConsequence,
                                    (() => {
                                      switch (risk.riskType) {
                                        case "Maintenance": return maintenanceConsequenceLabels;
                                        case "Personnel": return personnelConsequenceLabels;
                                        case "Revenue": return revenueConsequenceLabels;
                                        case "Process": return processConsequenceLabels;
                                        case "Environmental": return environmentalConsequenceLabels;
                                        default: return personnelConsequenceLabels;
                                      }
                                    })()
                                  ),
                                  risk.riskType || ''
                                )}`}>
                                  {risk.mitigatedLikelihood} x {risk.mitigatedConsequence}
                                </span>
                                <span className="text-gray-500">= Score {getRiskScore(
                                  risk.mitigatedLikelihood,
                                  risk.mitigatedConsequence,
                                  (() => {
                                    switch (risk.riskType) {
                                      case "Maintenance": return maintenanceConsequenceLabels;
                                      case "Personnel": return personnelConsequenceLabels;
                                      case "Revenue": return revenueConsequenceLabels;
                                      case "Process": return processConsequenceLabels;
                                      case "Environmental": return environmentalConsequenceLabels;
                                      default: return personnelConsequenceLabels;
                                    }
                                  })()
                                )}</span>
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
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#00A3FF] hover:bg-[#00A3FF]/90">
                    Add Task
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Risk Matrix Dialog */}
      <Dialog open={showRiskMatrix} onOpenChange={setShowRiskMatrix}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAsIsMatrix ? 'Associated Risks' : 'Post-Mitigation Risk Assessment'} - {
                isEditMode 
                  ? editTask?.risks?.find(r => r.id === activeRiskId)?.riskType || 'Risk'
                  : newTask.risks.find(r => r.id === activeRiskId)?.riskType || 'Risk'
              } Assessment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Configuration Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAsIsMatrix ? (
                  <Label>Risk Assessment</Label>
                ) : (
                  <div className="flex items-center gap-2">
                    <Label>Supervisor Signature Required for High Risk ({'>'}9)</Label>
                    <select
                      className="rounded-md border border-input px-3 py-1 text-sm"
                      value={enableSupervisorSignature.toString()}
                      onChange={(e) => setEnableSupervisorSignature(e.target.value === 'true')}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              {!isAsIsMatrix && activeRiskId && (
                isEditMode 
                  ? editTask?.risks?.find(r => r.id === activeRiskId)?.requiresSupervisorSignature
                  : newTask.risks.find(r => r.id === activeRiskId)?.requiresSupervisorSignature
              ) && (
                <div className="text-amber-600 flex items-center gap-2">
                  <span className="text-sm font-medium">⚠️ Supervisor Signature Required - Status will remain pending until approved</span>
                </div>
              )}
            </div>

            {/* Selected Risk Type */}
            {activeRiskId && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Risk Type:</span>
                <div className={`px-4 py-2 rounded-md ${
                  riskCategories.find(c => c.id === (
                    isEditMode 
                      ? editTask?.risks?.find(r => r.id === activeRiskId)?.riskType
                      : newTask.risks.find(r => r.id === activeRiskId)?.riskType
                  ))?.color || 'bg-gray-200'
                }`}>
                  {isEditMode 
                    ? editTask?.risks?.find(r => r.id === activeRiskId)?.riskType || 'Not Selected'
                    : newTask.risks.find(r => r.id === activeRiskId)?.riskType || 'Not Selected'
                  }
                </div>
              </div>
            )}

            {/* Risk Matrix Grid */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-6 divide-x divide-y">
                {/* Header */}
                <div className="bg-white p-4 font-medium">
                  Probability / Severity
                </div>
                {activeConsequenceLabels.map((consequence) => (
                  <div key={consequence.value} className="bg-white p-2 text-center">
                    <div className="font-medium">{consequence.label}</div>
                    <div className="text-xs text-gray-500">{consequence.description}</div>
                    <div className="text-xs font-medium mt-1">{consequence.score}</div>
                  </div>
                ))}

                {/* Matrix Rows */}
                {likelihoodLabels.map((likelihood) => (
                  <React.Fragment key={likelihood.value}>
                    <div className="bg-white p-2">
                      <div className="font-medium">{likelihood.label}</div>
                      <div className="text-xs text-gray-500">{likelihood.description}</div>
                      <div className="text-xs font-medium mt-1">{likelihood.score}</div>
                    </div>
                    {activeConsequenceLabels.map((consequence) => {
                      const score = getRiskScore(likelihood.value, consequence.value, activeConsequenceLabels);
                      const currentRisk = isEditMode
                        ? editTask?.risks?.find(r => r.id === activeRiskId)
                        : newTask.risks.find(r => r.id === activeRiskId);
                      
                      const isSelected = isAsIsMatrix
                        ? currentRisk?.asIsLikelihood === likelihood.value && 
                          currentRisk?.asIsConsequence === consequence.value
                        : currentRisk?.mitigatedLikelihood === likelihood.value && 
                          currentRisk?.mitigatedConsequence === consequence.value;

                      return (
                        <button
                          key={`${likelihood.value}-${consequence.value}`}
                          type="button"
                          className={`${getRiskColor(score, currentRisk?.riskType || '')} 
                            aspect-square flex items-center justify-center font-medium text-2xl
                            ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : ''}
                            hover:opacity-90 transition-opacity cursor-pointer`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRiskMatrixClick(likelihood.value, consequence.value, score);
                          }}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                {(() => {
                  const riskType = isEditMode
                    ? editTask?.risks?.find(r => r.id === activeRiskId)?.riskType || "Personnel"
                    : newTask.risks.find(r => r.id === activeRiskId)?.riskType || "Personnel";
                  const indicators = riskLevelIndicators[riskType as keyof typeof riskLevelIndicators] || riskLevelIndicators.Personnel;
                  
                  return (
                    <>
                      {indicators.map((indicator, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className={`w-4 h-4 ${indicator.color} rounded`}></div>
                          <span className="text-sm">{indicator.label}</span>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
              <Button onClick={() => setShowRiskMatrix(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task Hazard Assessment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this task hazard assessment? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task Hazard Assessment</DialogTitle>
          </DialogHeader>
          {editTask && (
            <form onSubmit={handleEditTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editTask.date}
                    onChange={(e) => setEditTask({...editTask, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={editTask.time}
                    onChange={(e) => setEditTask({...editTask, time: e.target.value})}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="scopeOfWork">Scope of Work</Label>
                  <Input
                    id="scopeOfWork"
                    value={editTask.scopeOfWork}
                    onChange={(e) => setEditTask({...editTask, scopeOfWork: e.target.value})}
                    placeholder="Enter scope of work"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemLockout">System Lockout Required</Label>
                  <select
                    id="systemLockout"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editTask.systemLockoutRequired.toString()}
                    onChange={(e) => setEditTask({...editTask, systemLockoutRequired: e.target.value === 'true'})}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trainedWorkforce">Trained Workforce</Label>
                  <Input
                    id="trainedWorkforce"
                    value={editTask.trainedWorkforce}
                    onChange={(e) => setEditTask({...editTask, trainedWorkforce: e.target.value})}
                    placeholder="Enter trained workforce"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geoFence">Geo Fence Settings</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full flex justify-between items-center"
                      onClick={() => openGeoFenceSettings(false)}
                    >
                      <span>Configure Geo Fence Limit</span>
                      <span className="text-sm text-gray-500">
                        Current: {editTask.geoFenceLimit || 200} Feet
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="individual">Individual/Team</Label>
                  <Select
                    value={editTask?.individual || ""}
                    onValueChange={(value) => setEditTask({...editTask!, individual: value})}
                  >
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supervisor">Supervisor</Label>
                  <Select
                    value={editTask?.supervisor || ""}
                    onValueChange={(value) => setEditTask({...editTask!, supervisor: value})}
                  >
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      value={editTask.location}
                      onChange={(e) => setEditTask({...editTask, location: e.target.value})}
                      placeholder="Enter location"
                      disabled={isLoadingLocation}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getLocation}
                      disabled={isLoadingLocation}
                    >
                      {isLoadingLocation ? "Getting Location..." : "Get Location"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editTask.status}
                    onChange={(e) => setEditTask({...editTask, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Risks and Controls</Label>
                  <Button 
                    type="button"
                    onClick={addEditRisk}
                    className="bg-[#00A3FF] hover:bg-[#00A3FF]/90"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Risk
                  </Button>
                </div>
                
                {editTask.risks && editTask.risks.map((risk) => (
                  <div key={risk.id} className="border rounded-lg p-4 space-y-4 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => risk.id && removeEditRisk(risk.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Risk Description</Label>
                        <Input
                          value={risk.riskDescription || ""}
                          onChange={(e) => risk.id && updateEditRisk(risk.id, { riskDescription: e.target.value })}
                          placeholder="E.g., Risk of pinch point"
                        />
                      </div>
                      
                      <div>
                        <Label>Risk Type</Label>
                        <Select
                          value={risk.riskType || ""}
                          onValueChange={(value) => risk.id && updateEditRisk(risk.id, { riskType: value })}
                        >
                          <SelectTrigger>
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
                      </div>
                      
                      <div>
                        <Label>Associated Risks</Label>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => risk.id && openRiskMatrix(risk.id, true, true)}
                        >
                          {risk.asIsLikelihood && risk.asIsConsequence ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded ${getRiskColor(
                                getRiskScore(
                                  risk.asIsLikelihood,
                                  risk.asIsConsequence,
                                  (() => {
                                    switch (risk.riskType) {
                                      case "Maintenance": return maintenanceConsequenceLabels;
                                      case "Personnel": return personnelConsequenceLabels;
                                      case "Revenue": return revenueConsequenceLabels;
                                      case "Process": return processConsequenceLabels;
                                      case "Environmental": return environmentalConsequenceLabels;
                                      default: return personnelConsequenceLabels;
                                    }
                                  })()
                                ),
                                risk.riskType || ''
                              )}`}>
                                {getRiskScore(
                                  risk.asIsLikelihood,
                                  risk.asIsConsequence,
                                  (() => {
                                    switch (risk.riskType) {
                                      case "Maintenance": return maintenanceConsequenceLabels;
                                      case "Personnel": return personnelConsequenceLabels;
                                      case "Revenue": return revenueConsequenceLabels;
                                      case "Process": return processConsequenceLabels;
                                      case "Environmental": return environmentalConsequenceLabels;
                                      default: return personnelConsequenceLabels;
                                    }
                                  })()
                                )}
                              </span>
                              <span>{`${risk.asIsLikelihood} / ${risk.asIsConsequence}`}</span>
                            </div>
                          ) : (
                            'Select Risk Level'
                          )}
                        </Button>
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Mitigating Action</Label>
                        <Input
                          value={risk.mitigatingAction || ""}
                          onChange={(e) => risk.id && updateEditRisk(risk.id, { mitigatingAction: e.target.value })}
                          placeholder="E.g., Wear gloves"
                        />
                      </div>
                      
                      <div>
                        <Label>Mitigating Action Type</Label>
                        <Select
                          value={risk.mitigatingActionType || ""}
                          onValueChange={(value) => risk.id && updateEditRisk(risk.id, { mitigatingActionType: value })}
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
                          onClick={() => risk.id && openRiskMatrix(risk.id, false, true)}
                        >
                          {risk.mitigatedLikelihood && risk.mitigatedConsequence ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded ${getRiskColor(
                                getRiskScore(
                                  risk.mitigatedLikelihood,
                                  risk.mitigatedConsequence,
                                  (() => {
                                    switch (risk.riskType) {
                                      case "Maintenance": return maintenanceConsequenceLabels;
                                      case "Personnel": return personnelConsequenceLabels;
                                      case "Revenue": return revenueConsequenceLabels;
                                      case "Process": return processConsequenceLabels;
                                      case "Environmental": return environmentalConsequenceLabels;
                                      default: return personnelConsequenceLabels;
                                    }
                                  })()
                                ),
                                risk.riskType || ''
                              )}`}>
                                {risk.mitigatedLikelihood} x {risk.mitigatedConsequence}
                              </span>
                              <span className="text-gray-500">= Score {getRiskScore(
                                risk.mitigatedLikelihood,
                                risk.mitigatedConsequence,
                                (() => {
                                  switch (risk.riskType) {
                                    case "Maintenance": return maintenanceConsequenceLabels;
                                    case "Personnel": return personnelConsequenceLabels;
                                    case "Revenue": return revenueConsequenceLabels;
                                    case "Process": return processConsequenceLabels;
                                    case "Environmental": return environmentalConsequenceLabels;
                                    default: return personnelConsequenceLabels;
                                  }
                                })()
                              )}</span>
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
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditTask(null)
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#00A3FF] hover:bg-[#00A3FF]/90">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 text-[#2C3E50] font-medium whitespace-nowrap">Task Risk ID</th>
                <th className="text-left p-4 text-[#2C3E50] font-medium whitespace-nowrap">Scope of Work</th>
                <th className="text-left p-4 text-[#2C3E50] font-medium whitespace-nowrap">Date & Time</th>
                <th className="text-left p-4 text-[#2C3E50] font-medium whitespace-nowrap">Location</th>
                <th className="text-left p-4 text-[#2C3E50] font-medium whitespace-nowrap">Highest Unmitigated</th>
                <th className="text-left p-4 text-[#2C3E50] font-medium whitespace-nowrap">Status</th>
                <th className="text-left p-4 text-[#2C3E50] font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && !error && tasks.length > 0 &&
                tasks
                  .filter(task => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      task.scopeOfWork?.toLowerCase().includes(searchLower) ||
                      task.assetSystem?.toLowerCase().includes(searchLower) ||
                      task.location?.toLowerCase().includes(searchLower) ||
                      task.individual?.toLowerCase().includes(searchLower) ||
                      task.supervisor?.toLowerCase().includes(searchLower) ||
                      task.id?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map(task => {
                    // Calculate highest unmitigated risk score
                    let highestUnmitigatedScore = 0;
                    let highestUnmitigatedType = "";
                    
                    if (task.risks && task.risks.length > 0) {
                      task.risks.forEach(risk => {
                        const consequenceLabels = (() => {
                          switch (risk.riskType) {
                            case "Maintenance": return maintenanceConsequenceLabels;
                            case "Personnel": return personnelConsequenceLabels;
                            case "Revenue": return revenueConsequenceLabels;
                            case "Process": return processConsequenceLabels;
                            case "Environmental": return environmentalConsequenceLabels;
                            default: return personnelConsequenceLabels;
                          }
                        })();
                        
                        const score = getRiskScore(risk.asIsLikelihood, risk.asIsConsequence, consequenceLabels);
                        if (score > highestUnmitigatedScore) {
                          highestUnmitigatedScore = score;
                          highestUnmitigatedType = risk.riskType;
                        }
                      });
                    }
                    
                    return (
                      <tr 
                        key={task.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setEditTask(task);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <td className="p-4 whitespace-nowrap">{highlightMatch(task.id, searchTerm)}</td>
                        <td className="p-4 whitespace-nowrap">{highlightMatch(task.scopeOfWork, searchTerm)}</td>
                        <td className="p-4 whitespace-nowrap">{task.date} {task.time}</td>
                        <td className="p-4 whitespace-nowrap">{highlightMatch(task.location, searchTerm)}</td>
                        <td className="p-4 whitespace-nowrap">
                          {highestUnmitigatedScore > 0 ? (
                            <span className={`px-2 py-1 rounded ${getRiskColor(highestUnmitigatedScore, highestUnmitigatedType)}`}>
                              {highestUnmitigatedScore}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            task.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : task.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : task.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTaskId(task.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              {(!isLoading && !error && tasks.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-4 text-center">No tasks found. Create a new task to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 