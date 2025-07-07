"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Shield, CheckCircle, XCircle, AlertTriangle, ClipboardList } from "lucide-react"
import { taskHazardApi } from "@/services/api"
import type { TaskHazard } from "@/services/api"
import { BackButton } from "@/components/ui/back-button"

export default function SupervisorDashboard() {
  const { toast } = useToast()
  const [pendingApprovals, setPendingApprovals] = useState<TaskHazard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskHazard | null>(null)
  const [removingTaskId, setRemovingTaskId] = useState<string | null>(null)
  
  // Fetch all task hazards that require supervisor approval
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setIsLoading(true)
        const response = await taskHazardApi.getTaskHazards()
        
        if (response && response.status && Array.isArray(response.data)) {
          // Get the supervisor email from localStorage
          const userData = localStorage.getItem('user')
          const user = userData ? JSON.parse(userData) : null
          const supervisorEmail = user?.email
          
          // Log all tasks before filtering
          
          // Filter tasks that have risks requiring supervisor signature
          const tasksRequiringApproval = response.data.filter(task => {

            
            // Only include tasks assigned to this supervisor
            if (task.supervisor !== supervisorEmail) {
              return false
            }
            
            // Exclude tasks that have already been approved or rejected
            if (task.status === 'Rejected' || task.status === 'Active') {
              return false
            }
            
            // Check if any risks in this task require supervisor signature
            return task.risks.some(risk => risk.requiresSupervisorSignature)
          })
          
          setPendingApprovals(tasksRequiringApproval)
          
          // Set the first task as selected by default if available
          if (tasksRequiringApproval.length > 0 && !selectedTask) {
            setSelectedTask(tasksRequiringApproval[0])
          }
        }
      } catch (error) {
        console.error('Error fetching pending approvals:', error)
        toast({
          title: "Error",
          description: "Failed to load pending approval requests.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPendingApprovals()
  }, [toast, selectedTask])
  
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
      await taskHazardApi.updateTaskHazard(taskId, {
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
      await taskHazardApi.updateTaskHazard(taskId, {
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
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
            <div className="flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-gray-500" />
              <span className="text-gray-700">Dashboard</span>
            </div>
          </div>
          
          {/* Approval Requests Menu Item - Highlighted */}
          <div className="px-4 py-2 bg-blue-50 border-l-4 border-blue-500 cursor-pointer">
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-500" />
              <span className="text-blue-700 font-medium">Approval Requests</span>
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium py-0.5 px-2 rounded-full">
                {pendingApprovals.length}
              </span>
            </div>
          </div>
          
          {/* Tasks Menu Item */}
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-gray-500" />
              <span className="text-gray-700">Approved Tasks</span>
            </div>
          </div>
        </div>
        
        {/* Approval Requests List Section */}
        <div className="px-4 pt-4 pb-2 border-t mt-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            PENDING REQUESTS
          </h3>
          
          {isLoading ? (
            <div className="text-center py-4 text-sm text-gray-500">Loading...</div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              No pending approval requests
            </div>
          ) : (
            <div className="space-y-2">
              {pendingApprovals.map(task => (
                <div 
                  key={task.id} 
                  className={`p-3 rounded-md cursor-pointer transition-all duration-300 ${
                    removingTaskId === task.id 
                      ? 'opacity-0 transform translate-x-4' 
                      : 'opacity-100'
                  } ${
                    selectedTask?.id === task.id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-gray-100'
                  }`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{task.scopeOfWork}</p>
                      <p className="text-xs text-gray-500 mt-1">ID: {task.id}...</p>
                      <p className="text-xs text-gray-500">Date: {task.date}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          {task.risks.filter(r => r.requiresSupervisorSignature).length} high risk item(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
          <h1 className="text-2xl font-bold mb-6">Supervisor Dashboard</h1>
          
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">Loading approval requests...</div>
              </CardContent>
            </Card>
          ) : selectedTask ? (
            <Card>
              <CardHeader>
                <CardTitle>Task Approval Details</CardTitle>
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
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">High Risk Items Requiring Approval</h3>
                  <div className="space-y-3">
                    {selectedTask.risks
                      .filter(risk => risk.requiresSupervisorSignature)
                      .map(risk => (
                        <div key={risk.id} className="bg-amber-50 border border-amber-200 rounded-md p-3">
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
                          <div className="mt-2">
                            <span className="text-amber-600 text-xs">⚠️ High risk activity requires supervisor approval</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Pending Approval Requests</h3>
                  <p className="text-sm">There are no tasks that require your approval at this time.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 