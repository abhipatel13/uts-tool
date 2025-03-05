"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

const taskHazardData = [
  {
    id: "ABC123",
    scopeOfWork: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnaga...",
    dateTime: "18/09/2020 , 10:00AM",
    associatedRisk: "Very Unlikely",
    location: "Long Location Name",
    highestUnmitigated: 10,
    status: "Active",
  },
  {
    id: "ABC123",
    scopeOfWork: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor",
    dateTime: "18/09/2020 , 10:00AM",
    associatedRisk: "Very Unlikely",
    location: "Very Location Name",
    highestUnmitigated: 2,
    status: "Active",
  },
  // Add more sample data as needed
]

const staticAssets = [
  { id: "V1F-01-01", name: "Facilities - Plumbing", description: "Plumbing Systems" },
  { id: "V1F-01-02", name: "Facilities - HVAC System", description: "HVAC Systems" },
  { id: "V1F-01", name: "Facilities - Main Building (G)", description: "Main Building" },
  { id: "V1F", name: "O&R Facilities", description: "Facilities Management" },
  { id: "V1", name: "VTA Overhaul and Repair Division", description: "O&R Division" },
  { id: "V", name: "VTA Maintenance", description: "VTA Maintenance Division" },
]

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

const consequenceLabels = [
  { value: "Minor", label: "Minor Injury", description: "No Lost time", score: 1 },
  { value: "Significant", label: "Significant", description: "Lost time", score: 2 },
  { value: "Serious", label: "Serious Injury", description: "Short Term Disability", score: 3 },
  { value: "Major", label: "Major Injury", description: "Long Term Disability", score: 4 },
  { value: "Catastrophic", label: "Catastrophic", description: "Fatality", score: 5 },
]

const likelihoodLabels = [
  { value: "Very Unlikely", label: "Very Unlikely", description: "Once in Lifetime > 75 Years", score: 1 },
  { value: "Slight Chance", label: "Slight Chance", description: "Once in 10 to 75 Years", score: 2 },
  { value: "Feasible", label: "Feasible", description: "Once in 10 Years", score: 3 },
  { value: "Likely", label: "Likely", description: "Once in 2 to 10 Years", score: 4 },
  { value: "Very Likely", label: "Very Likely", description: "Multiple times in 2 Years", score: 5 },
]

const getRiskColor = (score: number) => {
  if (score <= 2) return "bg-[#4CAF50] text-white"
  if (score <= 6) return "bg-[#FFC107] text-black"
  if (score <= 10) return "bg-[#FF9800] text-white"
  return "bg-[#F44336] text-white"
}

export default function TaskHazard() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchAsset, setSearchAsset] = useState("")
  const [showRiskMatrix, setShowRiskMatrix] = useState(false)
  const [activeRiskId, setActiveRiskId] = useState<string | null>(null)
  const [isAsIsMatrix, setIsAsIsMatrix] = useState(true)
  const [enableSupervisorSignature, setEnableSupervisorSignature] = useState(true)
  const [newTask, setNewTask] = useState({
    id: "",
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
  })

  const filteredAssets = staticAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchAsset.toLowerCase()) ||
    asset.description.toLowerCase().includes(searchAsset.toLowerCase())
  )

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Add your submit logic here
    console.log(newTask)
    setOpen(false)
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

  const openRiskMatrix = (riskId: string, isAsIs: boolean) => {
    setActiveRiskId(riskId)
    setIsAsIsMatrix(isAsIs)
    setShowRiskMatrix(true)
  }

  const navigateToSupervisorSignOff = (riskId: string) => {
    // Save current state if needed
    router.push(`/safety/supervisor-sign-off?riskId=${riskId}`)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Task Hazard Assessment</h1>
        <div className="flex gap-4">
          <Input 
            className="w-[300px]" 
            placeholder="Search field"
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
                    <Label htmlFor="taskId">Task Risk ID</Label>
                    <Input
                      id="taskId"
                      value={newTask.id}
                      onChange={(e) => setNewTask({...newTask, id: e.target.value})}
                      placeholder="Enter Task ID"
                    />
                  </div>
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
                    <Select
                      value={newTask.assetSystem}
                      onValueChange={(value) => setNewTask({...newTask, assetSystem: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select asset or system" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 pb-0">
                          <Input
                            placeholder="Search assets..."
                            value={searchAsset}
                            onChange={(e) => setSearchAsset(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {filteredAssets.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No assets found
                            </div>
                          ) : (
                            filteredAssets.map((asset) => (
                              <SelectItem key={asset.id} value={asset.id}>
                                <div className="flex flex-col py-1">
                                  <span className="font-medium">{asset.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {asset.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemLockout">System Lockout Required</Label>
                    <select
                      id="systemLockout"
                      className="w-full rounded-md border border-input px-3 py-2"
                      value={newTask.systemLockoutRequired.toString()}
                      onChange={(e) => setNewTask({...newTask, systemLockoutRequired: e.target.value === 'true'})}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="individual">Individual/Team</Label>
                    <Input
                      id="individual"
                      value={newTask.individual}
                      onChange={(e) => setNewTask({...newTask, individual: e.target.value})}
                      placeholder="Enter individual or team"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <Input
                      id="supervisor"
                      value={newTask.supervisor}
                      onChange={(e) => setNewTask({...newTask, supervisor: e.target.value})}
                      placeholder="Enter supervisor name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newTask.location}
                      onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                      placeholder="Enter location"
                    />
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
                        onClick={() => removeRisk(risk.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Risk Description</Label>
                          <Input
                            value={risk.riskDescription}
                            onChange={(e) => updateRisk(risk.id, { riskDescription: e.target.value })}
                            placeholder="E.g., Risk of pinch point"
                          />
                        </div>
                        
                        <div>
                          <Label>Risk Type</Label>
                          <Select
                            value={risk.riskType}
                            onValueChange={(value) => updateRisk(risk.id, { riskType: value })}
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
                            onClick={() => openRiskMatrix(risk.id, true)}
                          >
                            {risk.asIsLikelihood && risk.asIsConsequence ? 
                              `${risk.asIsLikelihood} / ${risk.asIsConsequence}` :
                              'Select Risk Level'
                            }
                          </Button>
                        </div>
                        
                        <div className="col-span-2">
                          <Label>Mitigating Action</Label>
                          <Input
                            value={risk.mitigatingAction}
                            onChange={(e) => updateRisk(risk.id, { mitigatingAction: e.target.value })}
                            placeholder="E.g., Wear gloves"
                          />
                        </div>
                        
                        <div>
                          <Label>Mitigating Action Type</Label>
                          <Select
                            value={risk.mitigatingActionType}
                            onValueChange={(value) => updateRisk(risk.id, { mitigatingActionType: value })}
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
                            onClick={() => openRiskMatrix(risk.id, false)}
                          >
                            {risk.mitigatedLikelihood && risk.mitigatedConsequence ? 
                              `${risk.mitigatedLikelihood} / ${risk.mitigatedConsequence}` :
                              'Select Risk Level'
                            }
                          </Button>
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
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto before:bg-transparent after:bg-transparent">
          <DialogHeader>
            <DialogTitle>
              {isAsIsMatrix ? 'Associated Risks' : 'Post-Mitigation Risks'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Configuration Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAsIsMatrix ? (
                  <Label htmlFor="supervisorSignature">Risk Assessment</Label>
                ) : (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="supervisorSignature">Supervisor Signature Required for High Risk ({'>'}9)</Label>
                    <select
                      id="supervisorSignature"
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
              {!isAsIsMatrix && activeRiskId && newTask.risks.find(r => r.id === activeRiskId)?.requiresSupervisorSignature && (
                <div className="text-amber-600 flex items-center gap-2">
                  <span className="text-sm font-medium">⚠️ Supervisor Signature Required</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs"
                    onClick={() => navigateToSupervisorSignOff(activeRiskId)}
                  >
                    Sign Off
                  </Button>
                </div>
              )}
            </div>

            {/* Selected Risk Type */}
            {activeRiskId && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Risk Type:</span>
                <div className={`px-4 py-2 rounded-md ${
                  riskCategories.find(c => c.id === newTask.risks.find(r => r.id === activeRiskId)?.riskType)?.color || 'bg-gray-200'
                }`}>
                  {newTask.risks.find(r => r.id === activeRiskId)?.riskType || 'Not Selected'}
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
                {consequenceLabels.map((consequence) => (
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
                    {consequenceLabels.map((consequence) => {
                      const score = likelihood.score * consequence.score
                      const isSelected = 
                        isAsIsMatrix 
                          ? newTask.risks.find(r => r.id === activeRiskId)?.asIsLikelihood === likelihood.value &&
                            newTask.risks.find(r => r.id === activeRiskId)?.asIsConsequence === consequence.value
                          : newTask.risks.find(r => r.id === activeRiskId)?.mitigatedLikelihood === likelihood.value &&
                            newTask.risks.find(r => r.id === activeRiskId)?.mitigatedConsequence === consequence.value
                      return (
                        <button
                          key={`${likelihood.value}-${consequence.value}`}
                          className={`${getRiskColor(score)} aspect-square flex items-center justify-center font-medium text-2xl
                            ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : ''}
                            hover:opacity-90 transition-opacity`}
                          onClick={() => {
                            if (activeRiskId) {
                              const updates: Partial<Risk> = isAsIsMatrix
                                ? { 
                                    asIsLikelihood: likelihood.value,
                                    asIsConsequence: consequence.value,
                                  }
                                : {
                                    mitigatedLikelihood: likelihood.value,
                                    mitigatedConsequence: consequence.value,
                                    requiresSupervisorSignature: enableSupervisorSignature && score > 9
                                  }
                              updateRisk(activeRiskId, updates)
                              
                              if (!isAsIsMatrix && enableSupervisorSignature && score > 9) {
                                setShowRiskMatrix(false)
                                setTimeout(() => navigateToSupervisorSignOff(activeRiskId), 100)
                              }
                            }
                          }}
                        >
                          {score}
                        </button>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#4CAF50] rounded"></div>
                  <span className="text-sm">Low Risk (1-2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#FFC107] rounded"></div>
                  <span className="text-sm">Medium Risk (3-6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#FF9800] rounded"></div>
                  <span className="text-sm">High Risk (8-10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#F44336] rounded"></div>
                  <span className="text-sm">Critical Risk (12-25)</span>
                </div>
              </div>
              <Button onClick={() => setShowRiskMatrix(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 text-[#2C3E50] font-medium">Task Risk ID</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Scope of Work</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Date & Time</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Location</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Highest Unmitigated</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {taskHazardData.map((task, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-600">{task.id}</td>
                <td className="p-4 text-gray-600 max-w-xs truncate">
                  {task.scopeOfWork}
                </td>
                <td className="p-4 text-gray-600">{task.dateTime}</td>
                <td className="p-4 text-gray-600">{task.location}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      task.highestUnmitigated >= 7 ? 'bg-red-500' : 
                      task.highestUnmitigated >= 4 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`} />
                    <span>{task.highestUnmitigated}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-green-600 bg-green-100">
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 