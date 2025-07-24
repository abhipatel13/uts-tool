"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TaskHazardApi } from "@/services"
import type { TaskHazard } from "@/types"
import TaskHazardForm from "@/components/TaskHazardForm"
import {
  getRiskScore,
  getRiskColor,
  getConsequenceLabels
} from "@/lib/risk-utils"
import { CommonButton } from "@/components/ui/common-button"

// Define interface for task data
type TaskHazardData = TaskHazard;

export default function TaskHazard() {
  const { toast } = useToast() as { toast: (params: { title: string; description: string; variant?: "default" | "destructive" }) => void }
  const [open, setOpen] = useState(false)

  // Add state for API data
  const [tasks, setTasks] = useState<TaskHazardData[]>([])  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editTask, setEditTask] = useState<TaskHazardData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // Define fetchTasks function outside of useEffect so it can be reused
  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const response = await TaskHazardApi.getTaskHazards()
      
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

  // Highlight matching text in search results
  const highlightMatch = (text: string | undefined | null, searchTerm: string) => {
    // Convert text to string and handle all edge cases
    const textStr = text != null ? String(text) : '';
    if (!textStr || !searchTerm.trim()) return textStr;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = textStr.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-200">{part}</span> : part
    );
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return

    try {
      await TaskHazardApi.deleteTaskHazard(deleteTaskId)
      
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">

      </div>
      
      {/* Responsive header section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50]">Task Hazard Assessment</h1>
          
          {/* Search and Add button row */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="flex-1 sm:max-w-md order-2 sm:order-1">
              <Input 
                className="w-full" 
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <CommonButton 
              className="gap-2 w-full sm:w-auto sm:flex-shrink-0 order-1 sm:order-2" 
              onClick={() => setOpen(true)}
            >
              <Plus className="h-4 w-4" /> ADD NEW
            </CommonButton>
          </div>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Task Hazard Assessment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this task hazard assessment? This action cannot be undone.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
            <CommonButton variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </CommonButton>
            <CommonButton 
              variant="destructive" 
              onClick={handleDeleteTask}
              className="w-full sm:w-auto"
            >
              Delete
            </CommonButton>
          </div>
        </DialogContent>
      </Dialog>

      <TaskHazardForm
        open={open}
        onOpenChange={setOpen}
        mode="create"
        onSuccess={fetchTasks}
      />

      <TaskHazardForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        task={editTask}
        onSuccess={fetchTasks}
      />

            {/* Desktop/Tablet Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto min-w-[600px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">ID</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm">Scope of Work</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Date & Time</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm hidden lg:table-cell">Location</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Risk</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Status</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && !error && tasks.length > 0 &&
                tasks
                  .filter(task => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      (task.scopeOfWork && task.scopeOfWork.toLowerCase().includes(searchLower)) ||
                      (task.assetSystem && task.assetSystem.toLowerCase().includes(searchLower)) ||
                      (task.location && task.location.toLowerCase().includes(searchLower)) ||
                      (task.individual && task.individual.toLowerCase().includes(searchLower)) ||
                      (task.supervisor && task.supervisor.toLowerCase().includes(searchLower)) ||
                      (task.id && task.id.toString().includes(searchLower))
                    );
                  })
                  .map(task => {
                    // Calculate highest unmitigated risk score
                    let highestUnmitigatedScore = 0;
                    let highestUnmitigatedType = "";
                    
                    if (task.risks && task.risks.length > 0) {
                      task.risks.forEach(risk => {
                        const consequenceLabels = getConsequenceLabels(risk.riskType);
                        
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
                        <td className="p-3 sm:p-4">
                          <div className="text-sm font-medium">{highlightMatch(task.id, searchTerm)}</div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="text-sm break-words">{highlightMatch(task.scopeOfWork, searchTerm)}</div>
                        </td>
                        <td className="p-3 sm:p-4 text-sm">{task.date} {task.time}</td>
                        <td className="p-3 sm:p-4 hidden lg:table-cell text-sm break-words">{highlightMatch(task.location, searchTerm)}</td>
                        <td className="p-3 sm:p-4">
                          {highestUnmitigatedScore > 0 ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(highestUnmitigatedScore, highestUnmitigatedType)}`}>
                              {highestUnmitigatedScore}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="p-3 sm:p-4">
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
                        <td className="p-3 sm:p-4">
                          <div className="flex gap-1 sm:gap-2">
                            <CommonButton
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-9 sm:w-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTaskId(task.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </CommonButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              {(!isLoading && !error && tasks.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-lg">No tasks found</div>
                      <div className="text-sm">Create a new task to get started.</div>
                    </div>
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A3FF]"></div>
                      <span>Loading tasks...</span>
                    </div>
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-red-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-lg">Error loading tasks</div>
                      <div className="text-sm">{error}</div>
                      <CommonButton 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchTasks}
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
        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A3FF]"></div>
              <span>Loading tasks...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-red-500">
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg">Error loading tasks</div>
              <div className="text-sm">{error}</div>
              <CommonButton 
                variant="outline" 
                size="sm" 
                onClick={fetchTasks}
                className="mt-2"
              >
                Try Again
              </CommonButton>
            </div>
          </div>
        )}
        
        {!isLoading && !error && tasks.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg">No tasks found</div>
              <div className="text-sm">Create a new task to get started.</div>
            </div>
          </div>
        )}
        
        {!isLoading && !error && tasks.length > 0 && (
          <div className="space-y-4">
            {tasks
              .filter(task => {
                const searchLower = searchTerm.toLowerCase();
                return (
                  (task.scopeOfWork && task.scopeOfWork.toLowerCase().includes(searchLower)) ||
                  (task.assetSystem && task.assetSystem.toLowerCase().includes(searchLower)) ||
                  (task.location && task.location.toLowerCase().includes(searchLower)) ||
                  (task.individual && task.individual.toLowerCase().includes(searchLower)) ||
                  (task.supervisor && task.supervisor.toLowerCase().includes(searchLower)) ||
                  (task.id && task.id.toString().includes(searchLower))
                );
              })
              .map(task => {
                // Calculate highest unmitigated risk score
                let highestUnmitigatedScore = 0;
                let highestUnmitigatedType = "";
                
                if (task.risks && task.risks.length > 0) {
                  task.risks.forEach(risk => {
                    const consequenceLabels = getConsequenceLabels(risk.riskType);
                    
                    const score = getRiskScore(risk.asIsLikelihood, risk.asIsConsequence, consequenceLabels);
                    if (score > highestUnmitigatedScore) {
                      highestUnmitigatedScore = score;
                      highestUnmitigatedType = risk.riskType;
                    }
                  });
                }
                
                return (
                  <div 
                    key={task.id} 
                    className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setEditTask(task);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    {/* Header with ID and Actions */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#2C3E50] mb-1">
                          Task ID: {highlightMatch(task.id, searchTerm)}
                        </div>
                        <div className="flex items-center gap-2">
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
                          {highestUnmitigatedScore > 0 && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(highestUnmitigatedScore, highestUnmitigatedType)}`}>
                              Risk: {highestUnmitigatedScore}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTaskId(task.id);
                          setIsDeleteDialogOpen(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-600 font-medium">Scope of Work</div>
                        <div className="text-sm text-gray-900">{highlightMatch(task.scopeOfWork, searchTerm)}</div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <div className="text-xs text-gray-600 font-medium">Date & Time</div>
                          <div className="text-sm text-gray-900">{task.date} {task.time}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-600 font-medium">Location</div>
                          <div className="text-sm text-gray-900">{highlightMatch(task.location, searchTerm)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  )
} 