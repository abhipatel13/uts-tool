"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Shield, CheckCircle, XCircle, AlertTriangle, ClipboardList } from "lucide-react"
import { taskHazardApi } from "@/services/api"
import type { TaskHazard } from "@/services/api"
import { BackButton } from "@/components/ui/back-button"

type ViewType = 'dashboard' | 'approval-requests' | 'approved-tasks' | 'rejected-tasks'

export default function SupervisorDashboard() {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [allTasks, setAllTasks] = useState<TaskHazard[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<TaskHazard[]>([])
  const [approvedTasks, setApprovedTasks] = useState<TaskHazard[]>([])
  const [rejectedTasks, setRejectedTasks] = useState<TaskHazard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskHazard | null>(null)
  const [removingTaskId, setRemovingTaskId] = useState<string | null>(null)
  
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
        const response = await taskHazardApi.getTaskHazards()
        
        if (response && response.status && Array.isArray(response.data)) {
          // Get the supervisor email from localStorage
          const userData = localStorage.getItem('user')
          const user = userData ? JSON.parse(userData) : null
          const supervisorEmail = user?.email
          
          // Filter tasks for this supervisor
          const supervisorTasks = response.data.filter(task => task.supervisor === supervisorEmail)
          
          // Filter tasks that require approval (pending approval requests)
          const tasksRequiringApproval = supervisorTasks.filter(task => {
            // Exclude tasks that have already been approved or rejected
            if (task.status === 'Rejected' || task.status === 'Active' || task.status === 'Completed') {
              return false
            }
            
            // Check if any risks in this task require supervisor signature
            return task.risks.some(risk => risk.requiresSupervisorSignature)
          })
          
          // Filter approved tasks (status: Active or Completed)
          const activeTasks = supervisorTasks.filter(task => task.status === 'Active' || task.status === 'Completed')
          
          // Filter rejected tasks (status: Rejected)
          const rejectedTasksList = supervisorTasks.filter(task => task.status === 'Rejected')
          
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
  
  const handleApprove = async (taskId: string) => {
    try {
      // Set the removing task ID to trigger the fade-out animation
      setRemovingTaskId(taskId)
      
      // Get the task
      const taskResponse = await taskHazardApi.getTaskHazard(taskId)
      if (!taskResponse.status || !taskResponse.data) {
        throw new Error('Failed to get task details')
      }
      
      const task = taskResponse.data
      
      // Update task status to Active
      await taskHazardApi.approveOrRejectTaskHazard(taskId, {
        ...task,
        status: 'Active'
      })
      
      toast({
        title: "Success",
        description: "Task has been approved and removed from pending requests.",
        variant: "default",
      })
      
      // Wait for the animation to complete before removing from state
      setTimeout(() => {
        // Remove the approved task from the pending approvals list
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
        
        // Add the approved task to the approved tasks list
        const approvedTask = { ...task, status: 'Active' as const }
        setApprovedTasks(prevApproved => [...prevApproved, approvedTask])
        
        // Update all tasks list
        setAllTasks(prevAll => 
          prevAll.map(t => t.id === taskId ? approvedTask : t)
        )
        
        // Reset the removing task ID
        setRemovingTaskId(null)
      }, 300) // Animation duration
    } catch (error) {
      console.error('Error approving task:', error)
      setRemovingTaskId(null) // Reset in case of error
      toast({
        title: "Error",
        description: "Failed to approve task.",
        variant: "destructive",
      })
    }
  }
  
  const handleReject = async (taskId: string) => {
    try {
      // Set the removing task ID to trigger the fade-out animation
      setRemovingTaskId(taskId)
      
      // Get the task
      const taskResponse = await taskHazardApi.getTaskHazard(taskId)
      if (!taskResponse.status || !taskResponse.data) {
        throw new Error('Failed to get task details')
      }
      
      const task = taskResponse.data
      
      // Update task status to Rejected
      await taskHazardApi.approveOrRejectTaskHazard(taskId, {
        ...task,
        status: 'Rejected'
      })
      
      toast({
        title: "Success",
        description: "Task has been rejected and removed from pending requests.",
        variant: "default",
      })
      
      // Wait for the animation to complete before removing from state
      setTimeout(() => {
        // Remove the rejected task from the pending approvals list
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
        
        // Add the rejected task to the rejected tasks list
        const rejectedTask = { ...task, status: 'Rejected' as const }
        setRejectedTasks(prevRejected => [...prevRejected, rejectedTask])
        
        // Update all tasks list
        setAllTasks(prevAll => 
          prevAll.map(t => t.id === taskId ? rejectedTask : t)
        )
        
        // Reset the removing task ID
        setRemovingTaskId(null)
      }, 300) // Animation duration
    } catch (error) {
      console.error('Error rejecting task:', error)
      setRemovingTaskId(null) // Reset in case of error
      toast({
        title: "Error",
        description: "Failed to reject task.",
        variant: "destructive",
      })
    }
  }

  // Helper function to get task status display info
  const getTaskStatusInfo = (task: TaskHazard) => {
    switch (task.status) {
      case 'Active':
        return { 
          icon: <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />,
          badge: 'Approved',
          badgeClass: 'bg-green-100 text-green-800'
        }
      case 'Completed':
        return { 
          icon: <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />,
          badge: 'Completed',
          badgeClass: 'bg-blue-100 text-blue-800'
        }
      case 'Rejected':
        return { 
          icon: <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />,
          badge: 'Rejected',
          badgeClass: 'bg-red-100 text-red-800'
        }
      default:
        return { 
          icon: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />,
          badge: `${task.risks.filter(r => r.requiresSupervisorSignature).length} high risk item(s)`,
          badgeClass: 'bg-amber-100 text-amber-800'
        }
    }
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Supervisor Dashboard</h2>
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
                Dashboard
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
              ? 'ALL TASKS'
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
                ? 'No tasks found'
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
                        task.status === 'Completed' ? (
                          <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{task.scopeOfWork}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {task.id}...</p>
                        <p className="text-xs text-gray-500">Date: {task.date}</p>
                        <div className="flex items-center mt-1">
                          {currentView === 'dashboard' ? (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${statusInfo.badgeClass}`}>
                              {statusInfo.badge}
                            </span>
                          ) : currentView === 'approval-requests' ? (
                            <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              {task.risks.filter(r => r.requiresSupervisorSignature).length} high risk item(s)
                            </span>
                          ) : currentView === 'approved-tasks' ? (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              task.status === 'Completed' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {task.status === 'Completed' ? 'Completed' : 'Approved'}
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
          <div className="mb-6">
            <BackButton text="Back" />
          </div>
          <h1 className="text-2xl font-bold mb-6">
            Supervisor Dashboard - {currentView === 'dashboard'
              ? 'All Tasks'
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
                      selectedTask.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedTask.status === 'Completed'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedTask.status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedTask.status === 'Active' 
                        ? 'Approved' 
                        : selectedTask.status === 'Completed'
                        ? 'Completed'
                        : selectedTask.status === 'Rejected'
                        ? 'Rejected'
                        : 'Pending Approval'
                      }
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
                    ).map(risk => (
                      <div key={risk.id} className={`border rounded-md p-3 ${
                        currentView === 'approval-requests' 
                          ? 'bg-amber-50 border-amber-200'
                          : currentView === 'approved-tasks'
                          ? risk.requiresSupervisorSignature 
                            ? selectedTask.status === 'Completed'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                          : currentView === 'rejected-tasks'
                          ? risk.requiresSupervisorSignature
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                          : risk.requiresSupervisorSignature
                          ? selectedTask.status === 'Active'
                            ? 'bg-green-50 border-green-200'
                            : selectedTask.status === 'Completed'
                            ? 'bg-blue-50 border-blue-200'
                            : selectedTask.status === 'Rejected'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-amber-50 border-amber-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className="font-medium">{risk.riskDescription}</p>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Risk Type:</span> {risk.riskType}
                          </div>
                          <div>
                            <span className="text-gray-600">As-Is Assessment:</span> {risk.asIsLikelihood} / {risk.asIsConsequence}
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Mitigating Action:</span> {risk.mitigatingAction} ({risk.mitigatingActionType})
                          </div>
                          <div>
                            <span className="text-gray-600">Post-Mitigation:</span> {risk.mitigatedLikelihood} / {risk.mitigatedConsequence}
                          </div>
                        </div>
                        {risk.requiresSupervisorSignature && (
                          <div className="mt-2">
                            <span className={`text-xs ${
                              currentView === 'approval-requests' 
                                ? 'text-amber-600' 
                                : currentView === 'approved-tasks'
                                ? selectedTask.status === 'Completed'
                                  ? 'text-blue-600'
                                  : 'text-green-600'
                                : currentView === 'rejected-tasks'
                                ? 'text-red-600'
                                : selectedTask.status === 'Active'
                                ? 'text-green-600'
                                : selectedTask.status === 'Completed'
                                ? 'text-blue-600'
                                : selectedTask.status === 'Rejected'
                                ? 'text-red-600'
                                : 'text-amber-600'
                            }`}>
                              {currentView === 'approval-requests' 
                                ? '⚠️ High risk activity requires supervisor approval'
                                : currentView === 'approved-tasks'
                                ? selectedTask.status === 'Completed'
                                  ? '✅ High risk activity - completed'
                                  : '✅ High risk activity - supervisor approved'
                                : currentView === 'rejected-tasks'
                                ? '❌ High risk activity - supervisor rejected'
                                : selectedTask.status === 'Active'
                                ? '✅ High risk activity - supervisor approved'
                                : selectedTask.status === 'Completed'
                                ? '✅ High risk activity - completed'
                                : selectedTask.status === 'Rejected'
                                ? '❌ High risk activity - supervisor rejected'
                                : '⚠️ High risk activity requires supervisor approval'
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedTask.status === 'Pending' && (
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
                      ? 'There are no tasks assigned to you at this time.'
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