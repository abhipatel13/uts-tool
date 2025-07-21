"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RiskAssessmentApi } from "@/services"
import type { RiskAssessment } from "@/types"
import RiskAssessmentForm from "@/components/RiskAssessmentForm"

// Define interface for assessment data
type RiskAssessmentData = RiskAssessment;

export default function RiskAssessment() {
  const { toast } = useToast() as { toast: (params: { title: string; description: string; variant?: "default" | "destructive" }) => void }
  const [open, setOpen] = useState(false)

  // Add state for API data
  const [assessments, setAssessments] = useState<RiskAssessmentData[]>([])  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteAssessmentId, setDeleteAssessmentId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editAssessment, setEditAssessment] = useState<RiskAssessmentData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // Define fetchAssessments function outside of useEffect so it can be reused
  const fetchAssessments = async () => {
    try {
      setIsLoading(true)
      const response = await RiskAssessmentApi.getRiskAssessments()
      
      // Check if response has the expected structure with data property
      if (response && response.status && Array.isArray(response.data)) {
        setAssessments(response.data)
      } else {
        // Fallback if the response structure is unexpected
        setAssessments([])
      }
      
      setError(null)
    } catch (error) {
      console.error("Error fetching assessments:", error)
      setError("Failed to load assessments. Please try again later.")
      // Set assessments to empty array on error
      setAssessments([])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch all assessments when component mounts
  useEffect(() => {
    fetchAssessments()
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

  const handleDeleteAssessment = async () => {
    if (!deleteAssessmentId) return

    try {
      await RiskAssessmentApi.deleteRiskAssessment(deleteAssessmentId)
      
      toast({
        title: "Success",
        description: "Risk assessment has been deleted successfully.",
        variant: "default",
      })
      
      // Refresh assessments list
      fetchAssessments()
    } catch (error) {
      console.error('Error deleting assessment:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete risk assessment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteAssessmentId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <BackButton text="Back" />
      </div>
      
      {/* Responsive header section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50]">Risk Assessment Dashboard</h1>
          
          {/* Search and Add button row */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="flex-1 sm:max-w-md order-2 sm:order-1">
              <Input 
                className="w-full" 
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 gap-2 w-full sm:w-auto sm:flex-shrink-0 order-1 sm:order-2" 
              onClick={() => setOpen(true)}
            >
              <Plus className="h-4 w-4" /> ADD NEW
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Risk Assessment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this risk assessment? This action cannot be undone.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAssessment}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RiskAssessmentForm
        open={open}
        onOpenChange={setOpen}
        mode="create"
        onSuccess={fetchAssessments}
      />

      <RiskAssessmentForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        assessment={editAssessment}
        onSuccess={fetchAssessments}
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
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Status</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && !error && assessments.length > 0 &&
                assessments
                  .filter(assessment => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      (assessment.scopeOfWork && assessment.scopeOfWork.toLowerCase().includes(searchLower)) ||
                      (assessment.location && assessment.location.toLowerCase().includes(searchLower)) ||
                      (assessment.individuals && assessment.individuals.toLowerCase().includes(searchLower)) ||
                      (assessment.supervisor && assessment.supervisor.toLowerCase().includes(searchLower)) ||
                      (assessment.id && assessment.id.toLowerCase().includes(searchLower))
                    );
                  })
                  .map(assessment => (
                    <tr 
                      key={assessment.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setEditAssessment(assessment);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <td className="p-3 sm:p-4">
                        <div className="text-sm font-medium">{highlightMatch(assessment.id, searchTerm)}</div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="text-sm break-words">{highlightMatch(assessment.scopeOfWork, searchTerm)}</div>
                      </td>
                      <td className="p-3 sm:p-4 text-sm">{assessment.date} {assessment.time}</td>
                      <td className="p-3 sm:p-4 hidden lg:table-cell text-sm break-words">{highlightMatch(assessment.location, searchTerm)}</td>
                      <td className="p-3 sm:p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          assessment.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : assessment.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : assessment.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assessment.status}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-9 sm:w-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteAssessmentId(assessment.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              {(!isLoading && !error && assessments.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-lg">No assessments found</div>
                      <div className="text-sm">Create a new assessment to get started.</div>
                    </div>
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A3FF]"></div>
                      <span>Loading assessments...</span>
                    </div>
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-red-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-lg">Error loading assessments</div>
                      <div className="text-sm">{error}</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchAssessments}
                        className="mt-2"
                      >
                        Try Again
                      </Button>
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
              <span>Loading assessments...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-red-500">
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg">Error loading assessments</div>
              <div className="text-sm">{error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAssessments}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
        
        {!isLoading && !error && assessments.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg">No assessments found</div>
              <div className="text-sm">Create a new assessment to get started.</div>
            </div>
          </div>
        )}
        
        {!isLoading && !error && assessments.length > 0 && (
          <div className="space-y-4">
            {assessments
              .filter(assessment => {
                const searchLower = searchTerm.toLowerCase();
                return (
                  (assessment.scopeOfWork && assessment.scopeOfWork.toLowerCase().includes(searchLower)) ||
                  (assessment.location && assessment.location.toLowerCase().includes(searchLower)) ||
                  (assessment.individuals && assessment.individuals.toLowerCase().includes(searchLower)) ||
                  (assessment.supervisor && assessment.supervisor.toLowerCase().includes(searchLower)) ||
                  (assessment.id && assessment.id.toString().includes(searchLower))
                );
              })
              .map(assessment => (
                <div 
                  key={assessment.id} 
                  className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setEditAssessment(assessment);
                    setIsEditDialogOpen(true);
                  }}
                >
                  {/* Header with ID and Actions */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#2C3E50] mb-1">
                        Assessment ID: {highlightMatch(assessment.id, searchTerm)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          assessment.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : assessment.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : assessment.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assessment.status}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteAssessmentId(assessment.id);
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
                      <div className="text-sm text-gray-900">{highlightMatch(assessment.scopeOfWork, searchTerm)}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <div className="text-xs text-gray-600 font-medium">Date & Time</div>
                        <div className="text-sm text-gray-900">{assessment.date} {assessment.time}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-600 font-medium">Location</div>
                        <div className="text-sm text-gray-900">{highlightMatch(assessment.location, searchTerm)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}