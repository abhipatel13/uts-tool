"use client"

import { useState, useEffect, useCallback } from 'react'
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
import type { TaskHazard } from "@/types"
import { TaskHazardDialog, type TaskHazardDialogMode } from "@/components/task-hazard"
import {
  getRiskScore,
  getRiskColor,
  getConsequenceLabels
} from "@/lib/risk-utils"
import { CommonButton } from "@/components/ui/common-button"
import { useTaskHazards, useTaskHazardMutations } from "@/hooks/useTaskHazards"
import { useNotificationEventListener } from "@/hooks/useNotifications"
import { NOTIFICATION_EVENTS } from "@/lib/notificationEvents"

export default function TaskHazardPage() {
  const { toast } = useToast()

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Dialog state
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskHazard | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<TaskHazardDialogMode>('view')

  // Use React Query hooks
  const {
    tasks,
    totalItems,
    totalPages,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTaskHazards({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
  })

  const { deleteTask, invalidateTaskHazards } = useTaskHazardMutations()

  // Listen for task notifications and refetch
  useNotificationEventListener(
    NOTIFICATION_EVENTS.TASK_NOTIFICATION,
    useCallback(() => {
      invalidateTaskHazards()
    }, [invalidateTaskHazards])
  )

  // Debounce search term
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      // Reset to page 1 when search changes
      if (searchTerm !== debouncedSearch) {
        setCurrentPage(1)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [searchTerm, debouncedSearch])

  // Highlight matching text in search results
  const highlightMatch = (text: string | undefined | null, term: string) => {
    const textStr = text != null ? String(text) : ''
    if (!textStr || !term.trim()) return textStr
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = textStr.split(regex)
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-200">{part}</span> : part
    )
  }

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return

    try {
      await deleteTask(deleteTaskId)
      
      toast({
        title: "Success",
        description: "Task hazard assessment has been deleted successfully.",
        variant: "default",
      })
    } catch (err) {
      console.error('Error deleting task:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete task hazard assessment.",
        variant: "destructive",
      })
    } finally {
      setDeleteTaskId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  // Calculate highest risk for a task
  const getHighestRisk = (task: Partial<TaskHazard>, useMitigated = true) => {
    let highestScore = 0
    let highestType = ""
    
    if (task.risks && task.risks.length > 0) {
      task.risks.forEach(risk => {
        const consequenceLabels = getConsequenceLabels(risk.riskType)
        const likelihood = useMitigated ? risk.mitigatedLikelihood : risk.asIsLikelihood
        const consequence = useMitigated ? risk.mitigatedConsequence : risk.asIsConsequence
        const score = getRiskScore(likelihood, consequence, consequenceLabels)
        if (score > highestScore) {
          highestScore = score
          highestType = risk.riskType
        }
      })
    }
    
    return { score: highestScore, type: highestType }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6"></div>
      
      {/* Header section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50]">Task Hazard Assessment</h1>
          
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
              onClick={() => {
                setSelectedTask(null)
                setDialogMode('create')
                setIsDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> ADD NEW
            </CommonButton>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
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
            <CommonButton variant="destructive" onClick={handleDeleteTask} className="w-full sm:w-auto">
              Delete
            </CommonButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <TaskHazardDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setSelectedTask(null)
        }}
        initialMode={dialogMode}
        task={selectedTask}
        onSuccess={invalidateTaskHazards}
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
              {!isLoading && !error && tasks.length > 0 && tasks.map(task => {
                const { score: highestScore, type: highestType } = getHighestRisk(task)
                
                return (
                  <tr 
                    key={task.id} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedTask(task as TaskHazard)
                      setDialogMode('view')
                      setIsDialogOpen(true)
                    }}
                  >
                    <td className="p-3 sm:p-4">
                      <div className="text-sm font-medium">{highlightMatch(task.id, searchTerm)}</div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="text-sm break-words">{highlightMatch(task.scopeOfWork, searchTerm)}</div>
                    </td>
                    <td className="p-3 sm:p-4 text-sm">{task.date} {task.time}</td>
                    <td className="p-3 sm:p-4 hidden lg:table-cell text-sm break-words">
                      {highlightMatch(task.location, searchTerm)}
                    </td>
                    <td className="p-3 sm:p-4">
                      {highestScore > 0 ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(highestScore, highestType)}`}>
                          {highestScore}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        task.status === 'Active' ? 'bg-green-100 text-green-800' 
                        : task.status === 'Pending' ? 'bg-amber-100 text-amber-800'
                        : task.status === 'Rejected' ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <CommonButton
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-9 sm:w-9"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTaskId(task.id!)
                          setIsDeleteDialogOpen(true)
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </CommonButton>
                    </td>
                  </tr>
                )
              })}
              
              {!isLoading && !error && tasks.length === 0 && (
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
                      <div className="text-sm">{error.message}</div>
                      <CommonButton variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
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

      {/* Pagination - Desktop */}
      <div className="hidden md:flex items-center justify-between bg-white rounded-lg shadow-sm border p-3 mb-6">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages} • Showing {tasks.length} of {totalItems} items
        </div>
        <div className="flex gap-2">
          <CommonButton
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || isFetching}
          >
            Previous
          </CommonButton>
          <CommonButton
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || isFetching}
          >
            Next
          </CommonButton>
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
              <div className="text-sm">{error.message}</div>
              <CommonButton variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
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
            {tasks.map(task => {
              const { score: highestScore, type: highestType } = getHighestRisk(task, false)

              return (
                <div 
                  key={task.id} 
                  className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedTask(task as TaskHazard)
                    setDialogMode('view')
                    setIsDialogOpen(true)
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#2C3E50] mb-1">
                        Task ID: {highlightMatch(task.id, searchTerm)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          task.status === 'Active' ? 'bg-green-100 text-green-800' 
                          : task.status === 'Pending' ? 'bg-amber-100 text-amber-800'
                          : task.status === 'Rejected' ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                        {highestScore > 0 && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(highestScore, highestType)}`}>
                            Risk: {highestScore}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTaskId(task.id!)
                        setIsDeleteDialogOpen(true)
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
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
              )
            })}
          </div>
        )}

        {/* Pagination - Mobile */}
        {!isLoading && !error && (
          <div className="flex md:hidden items-center justify-between bg-white rounded-lg shadow-sm border p-3 mt-4">
            <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isFetching}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
