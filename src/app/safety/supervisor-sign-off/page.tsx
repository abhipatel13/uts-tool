"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { taskHazardApi } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"
import type { TaskHazard } from "@/services/api"

function SupervisorSignOffContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const riskId = searchParams?.get('riskId') || 'unknown'
  const { toast } = useToast()
  
  const [supervisorName, setSupervisorName] = useState("")
  const [signatureData, setSignatureData] = useState("")
  const [pendingApprovals, setPendingApprovals] = useState<TaskHazard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch all task hazards that require supervisor approval
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setIsLoading(true)
        const response = await taskHazardApi.getTaskHazards()
        
        if (response && response.status && Array.isArray(response.data)) {
          // Filter tasks that have risks requiring supervisor signature
          const tasksRequiringApproval = response.data.filter(task => {
            // Get the supervisor email from localStorage
            const userData = localStorage.getItem('user')
            const user = userData ? JSON.parse(userData) : null
            const supervisorEmail = user?.email
            
            // Only include tasks assigned to this supervisor
            if (task.supervisor !== supervisorEmail) {
              return false
            }
            
            // Check if any risks in this task require supervisor signature
            return task.risks.some(risk => risk.requiresSupervisorSignature)
          })
          
          setPendingApprovals(tasksRequiringApproval)
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
  }, [toast])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    router.back()
  }
  
  const handleApprove = async (taskId: string) => {
    try {
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
        description: "Task has been approved successfully.",
        variant: "default",
      })
      
      // Remove the approved task from the pending approvals list
      setPendingApprovals(prevApprovals => 
        prevApprovals.filter(approval => approval.id !== taskId)
      )
    } catch (error) {
      console.error('Error approving task:', error)
      toast({
        title: "Error",
        description: "Failed to approve task.",
        variant: "destructive",
      })
    }
  }
  
  const handleReject = async (taskId: string) => {
    try {
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
        description: "Task has been rejected.",
        variant: "default",
      })
      
      // Remove the rejected task from the pending approvals list
      setPendingApprovals(prevApprovals => 
        prevApprovals.filter(approval => approval.id !== taskId)
      )
    } catch (error) {
      console.error('Error rejecting task:', error)
      toast({
        title: "Error",
        description: "Failed to reject task.",
        variant: "destructive",
      })
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Task Hazard
      </Button>
      
      {/* Approval Requests Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-bold mb-6">Approval Requests</h1>
        
        {isLoading ? (
          <div className="text-center py-8">Loading approval requests...</div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending approval requests.
          </div>
        ) : (
          <div className="space-y-6">
            {pendingApprovals.map(task => (
              <div key={task.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-lg">{task.scopeOfWork}</h3>
                    <p className="text-sm text-gray-500">Task ID: {task.id}</p>
                    <p className="text-sm text-gray-500">Date: {task.date} {task.time}</p>
                    <p className="text-sm text-gray-500">Location: {task.location}</p>
                    <p className="text-sm text-gray-500">Individual: {task.individual}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                      onClick={() => handleReject(task.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(task.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Risks Requiring Approval:</h4>
                  <div className="space-y-2">
                    {task.risks
                      .filter(risk => risk.requiresSupervisorSignature)
                      .map(risk => (
                        <div key={risk.id} className="bg-amber-50 border border-amber-200 rounded-md p-3">
                          <p className="font-medium">{risk.riskDescription}</p>
                          <p className="text-sm text-gray-600">Type: {risk.riskType}</p>
                          <p className="text-sm text-gray-600">
                            Mitigation: {risk.mitigatingAction} ({risk.mitigatingActionType})
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-amber-600 text-xs">⚠️ High risk activity requires supervisor approval</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Individual Risk Sign-off Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Supervisor Sign-off</h1>
        
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <h2 className="text-amber-800 font-medium">High Risk Activity</h2>
          <p className="text-amber-700 text-sm mt-1">
            Risk ID: {riskId}
          </p>
          <p className="text-amber-700 text-sm mt-1">
            This activity has been identified as high risk (score &gt; 9) and requires supervisor approval.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="supervisorName">Supervisor Name</Label>
            <Input 
              id="supervisorName" 
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="Enter supervisor name" 
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="supervisorSignature">Signature</Label>
            <div className="border rounded-md h-48 flex items-center justify-center text-gray-400 bg-gray-50">
              {/* In a real app, you would integrate a signature pad component here */}
              <div className="text-center">
                <p>Signature Pad</p>
                <p className="text-xs mt-2">Click or touch to sign</p>
                <Input 
                  type="hidden" 
                  value={signatureData}
                  onChange={(e) => setSignatureData(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Submit Signature</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SupervisorSignOff() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8">Loading...</div>}>
      <SupervisorSignOffContent />
    </Suspense>
  )
} 