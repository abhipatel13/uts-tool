"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Shield, CheckCircle, XCircle, AlertTriangle, ClipboardList } from "lucide-react"
import { TaskHazardApi } from "@/services"
import type { TaskHazardWithApprovals } from "@/types"
import { BackButton } from "@/components/ui/back-button"

type ViewType = 'dashboard' | 'approval-requests' | 'approved-tasks' | 'rejected-tasks'

// Helper functions to map integer values to string representations
const getLikelihoodString = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseInt(value) : value
  switch (numValue) {
    case 1: return 'Very Unlikely'
    case 2: return 'Unlikely'
    case 3: return 'Possible'
    case 4: return 'Likely'
    case 5: return 'Almost Certain'
    default: return value?.toString() || 'N/A'
  }
}

const getConsequenceString = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseInt(value) : value
  switch (numValue) {
    case 1: return 'Insignificant'
    case 2: return 'Minor'
    case 3: return 'Moderate'
    case 4: return 'Major'
    case 5: return 'Catastrophic'
    default: return value?.toString() || 'N/A'
  }
}

export default function SupervisorDashboard() {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [allTasks, setAllTasks] = useState<TaskHazardWithApprovals[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<TaskHazardWithApprovals[]>([])
  const [approvedTasks, setApprovedTasks] = useState<TaskHazardWithApprovals[]>([])
  const [rejectedTasks, setRejectedTasks] = useState<TaskHazardWithApprovals[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskHazardWithApprovals | null>(null)
  const [removingTaskId, setRemovingTaskId] = useState<string | null>(null)
  const [isAdminOrSuperUser, setIsAdminOrSuperUser] = useState(false)
  
  // Get current tasks list based on view
  const currentTasks = currentView === 'dashboard' 
    ? allTasks
    : currentView === 'approval-requests' 
    ? pendingApprovals 
    : currentView === 'approved-tasks'
    ? approvedTasks
    : rejectedTasks
  
  // Fetch task hazards based on current view
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const response = await TaskHazardApi.getApprovals({includeInvalidated: true})
        
        if (response && response.status && response.data) {
          // Get the user data from localStorage
          const userData = localStorage.getItem('user')
          const user = userData ? JSON.parse(userData) : null
          const currentUserRole = user?.role
          
          // Set user role state
          const isAdminOrSuper = currentUserRole === "admin" || currentUserRole === "superuser"
          setIsAdminOrSuperUser(isAdminOrSuper)
          
          const supervisorTasks = response.data.taskHazards
          
          // Filter tasks that require approval (pending approval requests)
          const tasksRequiringApproval = supervisorTasks.filter(task => {
            // Check if the task has any pending approvals
            return task.approvals.some(approval => approval.status === 'pending' && approval.isLatest)
          })
          
          // Filter approved tasks (latest approval is approved)
          const activeTasks = supervisorTasks.filter(task => {
            const latestApproval = task.approvals.find(approval => approval.isLatest)
            return latestApproval && latestApproval.status === 'approved'
          })
          
          // Filter rejected tasks (latest approval is rejected)
          const rejectedTasksList = supervisorTasks.filter(task => {
            const latestApproval = task.approvals.find(approval => approval.isLatest)
            return latestApproval && latestApproval.status === 'rejected'
          })
          
          setAllTasks(supervisorTasks)
          setPendingApprovals(tasksRequiringApproval)
          setApprovedTasks(activeTasks)
          setRejectedTasks(rejectedTasksList)
          
          // Set the first task as selected by default if available
          const currentTaskList = currentView === 'dashboard'
            ? supervisorTasks
            : currentView === 'approval-requests' 
            ? tasksRequiringApproval 
            : currentView === 'approved-tasks'
            ? activeTasks
            : rejectedTasksList
          if (currentTaskList.length > 0 && !selectedTask) {
            setSelectedTask(currentTaskList[0])
          } else if (currentTaskList.length === 0) {
            setSelectedTask(null)
          }
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
        toast({
          title: "Error",
          description: "Failed to load tasks.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTasks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, currentView])
  
  // Handle view change
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    setSelectedTask(null)
  }
  
  const handleTaskAction = async (taskId: string, action: 'Approved' | 'Rejected') => {
    try {
      // Set the removing task ID to trigger the fade-out animation
      setRemovingTaskId(taskId)
      
      // Update task status
      await TaskHazardApi.approveOrRejectTaskHazard(taskId, action)
      
      const isApproved = action === 'Approved'
      
      toast({
        title: "Success",
        description: `Task has been ${isApproved ? 'approved' : 'rejected'} and removed from pending requests.`,
        variant: "default",
      })
      
      // Wait for the animation to complete before removing from state
      setTimeout(() => {
        // Remove the task from the pending approvals list
        setPendingApprovals(prevApprovals => {
          const updatedApprovals = prevApprovals.filter(approval => approval.id !== taskId)
          // If there are still approvals, select the first one
          if (updatedApprovals.length > 0) {
            setSelectedTask(updatedApprovals[0])
          } else {
            setSelectedTask(null)
          }
          return updatedApprovals
        })
        
        // Find the task in all tasks and update its approvals
        const updatedTask = allTasks.find(t => t.id === taskId)
        if (updatedTask) {
          // Update the latest approval status
          const updatedTaskWithApproval = {
            ...updatedTask,
            approvals: updatedTask.approvals.map(approval => 
              approval.isLatest 
                ? { ...approval, status: isApproved ? 'approved' as const : 'rejected' as const, processedAt: new Date().toISOString() }
                : approval
            )
          }
          
          // Add the task to the appropriate list
          if (isApproved) {
            setApprovedTasks(prevApproved => [...prevApproved, updatedTaskWithApproval])
          } else {
            setRejectedTasks(prevRejected => [...prevRejected, updatedTaskWithApproval])
          }
          
          // Update all tasks list
          setAllTasks(prevAll => 
            prevAll.map(t => t.id === taskId ? updatedTaskWithApproval : t)
          )
        }
        
        // Reset the removing task ID
        setRemovingTaskId(null)
      }, 300) // Animation duration
    } catch (error) {
      console.error(`Error ${action.toLowerCase()} task:`, error)
      setRemovingTaskId(null) // Reset in case of error
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()} task.`,
        variant: "destructive",
      })
    }
  }
  
  // Wrapper functions for backwards compatibility
  const handleApprove = (taskId: string) => handleTaskAction(taskId, 'Approved')
  const handleReject = (taskId: string) => handleTaskAction(taskId, 'Rejected')

  // Helper function to get task status display info
  const getTaskStatusInfo = (task: TaskHazardWithApprovals) => {
    const latestApproval = task.approvals.find(approval => approval.isLatest)
    
    if (!latestApproval) {
      return { 
        icon: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />,
        badge: 'No approvals',
        badgeClass: 'bg-gray-100 text-gray-800'
      }
    }
    
    switch (latestApproval.status) {
      case 'approved':
        return { 
          icon: <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />,
          badge: 'Approved',
          badgeClass: 'bg-green-100 text-green-800'
        }
      case 'rejected':
        return { 
          icon: <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />,
          badge: 'Rejected',
          badgeClass: 'bg-red-100 text-red-800'
        }
      case 'pending':
        return { 
          icon: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />,
          badge: 'Pending Approval',
          badgeClass: 'bg-amber-100 text-amber-800'
        }
      default:
        return { 
          icon: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />,
          badge: 'Unknown Status',
          badgeClass: 'bg-gray-100 text-gray-800'
        }
    }
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">
            {isAdminOrSuperUser ? 'Task Management' : 'Supervisor Dashboard'}
          </h2>
        </div>
        
        {/* Sidebar Menu */}
        <div className="py-2">
          {/* Dashboard Overview */}
          <div 
            className={`px-4 py-2 cursor-pointer ${
              currentView === 'dashboard' 
                ? 'bg-blue-50 border-l-4 border-blue-500' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => handleViewChange('dashboard')}
          >
            <div className="flex items-center">
              <ClipboardList className={`h-5 w-5 mr-2 ${
                currentView === 'dashboard' ? 'text-blue-500' : 'text-gray-500'
              }`} />
              <span className={`${
                currentView === 'dashboard' ? 'text-blue-700 font-medium' : 'text-gray-700'
              }`}>
                {isAdminOrSuperUser ? 'All Tasks' : 'Dashboard'}
              </span>
              {allTasks.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium py-0.5 px-2 rounded-full">
                  {allTasks.length}
                </span>
              )}
            </div>
          </div>
          
          {/* Approval Requests Menu Item */}
          <div 
            className={`px-4 py-2 cursor-pointer ${
              currentView === 'approval-requests' 
                ? 'bg-amber-50 border-l-4 border-amber-500' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => handleViewChange('approval-requests')}
          >
            <div className="flex items-center">
              <Shield className={`h-5 w-5 mr-2 ${
                currentView === 'approval-requests' ? 'text-amber-500' : 'text-gray-500'
              }`} />
              <span className={`${
                currentView === 'approval-requests' ? 'text-amber-700 font-medium' : 'text-gray-700'
              }`}>
                Approval Requests
              </span>
              {pendingApprovals.length > 0 && (
                <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-medium py-0.5 px-2 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </div>
          </div>
          
          {/* Approved Tasks Menu Item */}
          <div 
            className={`px-4 py-2 cursor-pointer ${
              currentView === 'approved-tasks' 
                ? 'bg-green-50 border-l-4 border-green-500' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => handleViewChange('approved-tasks')}
          >
            <div className="flex items-center">
              <CheckCircle className={`h-5 w-5 mr-2 ${
                currentView === 'approved-tasks' ? 'text-green-500' : 'text-gray-500'
              }`} />
              <span className={`${
                currentView === 'approved-tasks' ? 'text-green-700 font-medium' : 'text-gray-700'
              }`}>
                Approved Tasks
              </span>
              {approvedTasks.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium py-0.5 px-2 rounded-full">
                  {approvedTasks.length}
                </span>
              )}
            </div>
          </div>
          
          {/* Rejected Tasks Menu Item */}
          <div 
            className={`px-4 py-2 cursor-pointer ${
              currentView === 'rejected-tasks' 
                ? 'bg-red-50 border-l-4 border-red-500' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => handleViewChange('rejected-tasks')}
          >
            <div className="flex items-center">
              <XCircle className={`h-5 w-5 mr-2 ${
                currentView === 'rejected-tasks' ? 'text-red-500' : 'text-gray-500'
              }`} />
              <span className={`${
                currentView === 'rejected-tasks' ? 'text-red-700 font-medium' : 'text-gray-700'
              }`}>
                Rejected Tasks
              </span>
              {rejectedTasks.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium py-0.5 px-2 rounded-full">
                  {rejectedTasks.length}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Task List Section */}
        <div className="px-4 pt-4 pb-2 border-t mt-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {currentView === 'dashboard'
              ? isAdminOrSuperUser ? 'ALL TASKS' : 'MY TASKS'
              : currentView === 'approval-requests' 
              ? 'PENDING REQUESTS' 
              : currentView === 'approved-tasks'
              ? 'APPROVED TASKS'
              : 'REJECTED TASKS'
            }
          </h3>
          
          {isLoading ? (
            <div className="text-center py-4 text-sm text-gray-500">Loading...</div>
          ) : currentTasks.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              {currentView === 'dashboard'
                ? isAdminOrSuperUser ? 'No tasks found in the system' : 'No tasks assigned to you'
                : currentView === 'approval-requests' 
                ? 'No pending approval requests' 
                : currentView === 'approved-tasks'
                ? 'No approved tasks'
                : 'No rejected tasks'
              }
            </div>
          ) : (
            <div className="space-y-2">
              {currentTasks.map(task => {
                const statusInfo = getTaskStatusInfo(task)
                return (
                  <div 
                    key={task.id} 
                    className={`p-3 rounded-md cursor-pointer transition-all duration-300 ${
                      removingTaskId === task.id 
                        ? 'opacity-0 transform translate-x-4' 
                        : 'opacity-100'
                    } ${
                      selectedTask?.id === task.id 
                        ? currentView === 'dashboard'
                          ? 'bg-blue-50 border border-blue-200'
                          : currentView === 'approval-requests'
                          ? 'bg-amber-50 border border-amber-200'
                          : currentView === 'approved-tasks'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                        : 'hover:bg-gray-50 border border-gray-100'
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start gap-2">
                      {currentView === 'dashboard' ? statusInfo.icon :
                      currentView === 'approval-requests' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      ) : currentView === 'approved-tasks' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{task.scopeOfWork}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {task.id}...</p>
                        <p className="text-xs text-gray-500">Date: {task.date}</p>
                        {isAdminOrSuperUser && (
                          <p className="text-xs text-gray-500">Supervisor: {task.supervisor}</p>
                        )}
                        <div className="flex items-center mt-1">
                          {currentView === 'dashboard' ? (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${statusInfo.badgeClass}`}>
                              {statusInfo.badge}
                            </span>
                          ) : currentView === 'approval-requests' ? (
                            <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              Pending Approval
                            </span>
                          ) : currentView === 'approved-tasks' ? (
                            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                              Approved
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">
            {isAdminOrSuperUser ? 'Task Management Dashboard' : 'Supervisor Dashboard'} - {currentView === 'dashboard'
              ? isAdminOrSuperUser ? 'All Tasks' : 'My Tasks'
              : currentView === 'approval-requests' 
              ? 'Approval Requests' 
              : currentView === 'approved-tasks'
              ? 'Approved Tasks'
              : 'Rejected Tasks'
            }
          </h1>
          
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">Loading tasks...</div>
              </CardContent>
            </Card>
          ) : selectedTask ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentView === 'approval-requests' 
                    ? 'Task Approval Details' 
                    : 'Task Details'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Task ID</h3>
                    <p>{selectedTask.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                    <p>{selectedTask.date} {selectedTask.time}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Individual/Team</h3>
                    <p>{selectedTask.individual}</p>
                  </div>
                  {isAdminOrSuperUser && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Supervisor</h3>
                      <p>{selectedTask.supervisor}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p>{selectedTask.location}</p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Scope of Work</h3>
                    <p>{selectedTask.scopeOfWork}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (() => {
                        const latestApproval = selectedTask.approvals.find(approval => approval.isLatest)
                        if (!latestApproval) return 'bg-gray-100 text-gray-800'
                        switch (latestApproval.status) {
                          case 'approved': return 'bg-green-100 text-green-800'
                          case 'rejected': return 'bg-red-100 text-red-800'
                          case 'pending': return 'bg-amber-100 text-amber-800'
                          default: return 'bg-gray-100 text-gray-800'
                        }
                      })()
                    }`}>
                      {(() => {
                        const latestApproval = selectedTask.approvals.find(approval => approval.isLatest)
                        if (!latestApproval) return 'No approvals'
                        switch (latestApproval.status) {
                          case 'approved': return 'Approved'
                          case 'rejected': return 'Rejected'
                          case 'pending': return 'Pending Approval'
                          default: return 'Unknown Status'
                        }
                      })()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {currentView === 'approval-requests' 
                      ? 'High Risk Items Requiring Approval' 
                      : 'Risk Items'
                    }
                  </h3>
                  <div className="space-y-3">
                    {(currentView === 'approval-requests' 
                      ? selectedTask.risks.filter(risk => risk.requiresSupervisorSignature)
                      : selectedTask.risks
                    ).map((risk, index) => (
                      <div key={risk.id || `risk-${index}`} className={`border rounded-md p-3 ${
                        (() => {
                          const latestApproval = selectedTask.approvals.find(approval => approval.isLatest)
                          if (!latestApproval) return 'bg-gray-50 border-gray-200'
                          
                          if (currentView === 'approval-requests') {
                            return 'bg-amber-50 border-amber-200'
                          } else if (currentView === 'approved-tasks') {
                            return risk.requiresSupervisorSignature 
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          } else if (currentView === 'rejected-tasks') {
                            return risk.requiresSupervisorSignature
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          } else {
                            // Dashboard view - show based on approval status
                            if (!risk.requiresSupervisorSignature) return 'bg-gray-50 border-gray-200'
                            switch (latestApproval.status) {
                              case 'approved': return 'bg-green-50 border-green-200'
                              case 'rejected': return 'bg-red-50 border-red-200'
                              case 'pending': return 'bg-amber-50 border-amber-200'
                              default: return 'bg-gray-50 border-gray-200'
                            }
                          }
                        })()
                      }`}>
                        <p className="font-medium">{risk.riskDescription}</p>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Risk Type:</span> {risk.riskType}
                          </div>
                          <div>
                            <span className="text-gray-600">As-Is Assessment:</span> {getLikelihoodString(risk.asIsLikelihood)} / {getConsequenceString(risk.asIsConsequence)}
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Mitigating Action:</span> {risk.mitigatingAction} ({risk.mitigatingActionType})
                          </div>
                          <div>
                            <span className="text-gray-600">Post-Mitigation:</span> {getLikelihoodString(risk.mitigatedLikelihood)} / {getConsequenceString(risk.mitigatedConsequence)}
                          </div>
                        </div>
                        {risk.requiresSupervisorSignature && (
                          <div className="mt-2">
                            <span className={`text-xs ${
                              (() => {
                                const latestApproval = selectedTask.approvals.find(approval => approval.isLatest)
                                if (!latestApproval) return 'text-gray-600'
                                
                                if (currentView === 'approval-requests') {
                                  return 'text-amber-600'
                                } else if (currentView === 'approved-tasks') {
                                  return 'text-green-600'
                                } else if (currentView === 'rejected-tasks') {
                                  return 'text-red-600'
                                } else {
                                  switch (latestApproval.status) {
                                    case 'approved': return 'text-green-600'
                                    case 'rejected': return 'text-red-600'
                                    case 'pending': return 'text-amber-600'
                                    default: return 'text-gray-600'
                                  }
                                }
                              })()
                            }`}>
                              {(() => {
                                const latestApproval = selectedTask.approvals.find(approval => approval.isLatest)
                                if (!latestApproval) return '❓ No approval data'
                                
                                if (currentView === 'approval-requests') {
                                  return '⚠️ High risk activity requires supervisor approval'
                                } else if (currentView === 'approved-tasks') {
                                  return '✅ High risk activity - supervisor approved'
                                } else if (currentView === 'rejected-tasks') {
                                  return '❌ High risk activity - supervisor rejected'
                                } else {
                                  switch (latestApproval.status) {
                                    case 'approved': return '✅ High risk activity - supervisor approved'
                                    case 'rejected': return '❌ High risk activity - supervisor rejected'
                                    case 'pending': return '⚠️ High risk activity requires supervisor approval'
                                    default: return '❓ Unknown approval status'
                                  }
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {(() => {
                  const latestApproval = selectedTask.approvals.find(approval => approval.isLatest)
                  return latestApproval && latestApproval.status === 'pending'
                })() && (
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                      onClick={() => handleReject(selectedTask.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(selectedTask.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}
                
                {/* Approval History Section */}
                {selectedTask.approvals.length > 1 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Approval History</h3>
                    <div className="space-y-3">
                      {selectedTask.approvals
                        .filter(approval => !approval.isLatest)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((approval, approvalIndex) => (
                          <div 
                            key={approval.id || `approval-${approvalIndex}`} 
                            className={`border rounded-md p-4 ${
                              approval.isInvalidated
                                ? 'bg-gray-50 border-gray-200 opacity-75'
                                : approval.status === 'approved'
                                ? 'bg-green-50 border-green-200'
                                : approval.status === 'rejected'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-amber-50 border-amber-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {approval.status === 'approved' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : approval.status === 'rejected' ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                )}
                                <span className={`text-sm font-medium ${
                                  approval.isInvalidated
                                    ? 'text-gray-600'
                                    : approval.status === 'approved'
                                    ? 'text-green-700'
                                    : approval.status === 'rejected'
                                    ? 'text-red-700'
                                    : 'text-amber-700'
                                }`}>
                                  {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                                  {approval.isInvalidated && ' (Invalidated)'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 text-right">
                                <div>Processed: {approval.processedAt ? new Date(approval.processedAt).toLocaleString() : 'Pending'}</div>
                                <div>Created: {new Date(approval.createdAt).toLocaleString()}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <span className="text-xs font-medium text-gray-600">Supervisor:</span>
                                <p className="text-sm">{approval.supervisor.name} ({approval.supervisor.email})</p>
                              </div>
                              {approval.comments && (
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Comments:</span>
                                  <p className="text-sm">{approval.comments}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Task Snapshot at time of approval */}
                            <div className="border-t pt-3 mt-3">
                              <span className="text-xs font-medium text-gray-600 mb-2 block">Task State at Time of Approval:</span>
                              <div className="text-sm space-y-1">
                                <div><span className="font-medium">Date:</span> {approval.taskHazardData.date}</div>
                                <div><span className="font-medium">Scope:</span> {approval.taskHazardData.scopeOfWork}</div>
                                                                 {approval.taskHazardData.risks.length > 0 && (
                                   <div className="mt-2">
                                     <span className="font-medium">Risks at that time:</span>
                                     <div className="mt-1 space-y-2">
                                       {approval.taskHazardData.risks.map((risk, riskIndex) => (
                                         <div key={risk.id || `history-risk-${approvalIndex}-${riskIndex}`} className="text-xs bg-white rounded p-3 border">
                                           <div className="font-medium mb-2">{risk.riskDescription}</div>
                                                                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                                              <div>
                                                <span className="font-medium text-gray-700">Risk Type:</span>
                                                <div>{risk.riskType || 'Not specified'}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium text-gray-700">As-Is Assessment:</span>
                                                <div>{getLikelihoodString(risk.asIsLikelihood || 'N/A')} / {getConsequenceString(risk.asIsConsequence || 'N/A')}</div>
                                              </div>
                                              <div className="sm:col-span-2">
                                                <span className="font-medium text-gray-700">Mitigation:</span>
                                                <div>{risk.mitigatingAction}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium text-gray-700">Mitigation Type:</span>
                                                <div>{risk.mitigatingActionType || 'Not specified'}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium text-gray-700">Post-Mitigation:</span>
                                                <div>{getLikelihoodString(risk.mitigatedLikelihood || 'N/A')} / {getConsequenceString(risk.mitigatedConsequence || 'N/A')}</div>
                                              </div>
                                              {risk.requiresSupervisorSignature && (
                                                <div className="sm:col-span-2">
                                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    ⚠️ Required Supervisor Signature
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    {currentView === 'dashboard'
                      ? 'No Tasks Found'
                      : currentView === 'approval-requests' 
                      ? 'No Pending Approval Requests' 
                      : currentView === 'approved-tasks'
                      ? 'No Approved Tasks'
                      : 'No Rejected Tasks'
                    }
                  </h3>
                  <p className="text-sm">
                    {currentView === 'dashboard'
                      ? isAdminOrSuperUser 
                        ? 'There are no tasks in the system at this time.'
                        : 'There are no tasks assigned to you at this time.'
                      : currentView === 'approval-requests' 
                      ? 'There are no tasks that require your approval at this time.'
                      : currentView === 'approved-tasks'
                      ? 'There are no approved tasks to display at this time.'
                      : 'There are no rejected tasks to display at this time.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 