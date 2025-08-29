"use client"

import { useEffect, useState } from "react"
import { RiskAssessmentApi } from "@/services"
import type { RiskAssessment } from "@/types"
import RiskAssessmentForm from "@/components/RiskAssessmentForm"
import { MapInfoDialog } from "@/components/analytics/MapInfoDialog"
import { AnalyticsPageWrapper } from "@/components/analytics/AnalyticsPageWrapper"

type RiskAssessmentData = RiskAssessment;

export default function RiskAssessmentAnalytics() {
  const [open, setOpen] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessmentData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [riskAssessments, setRiskAssessments] = useState<RiskAssessmentData[]>([]);
  const [filterAssessments, setFilterAssessments] = useState<RiskAssessmentData[]>([]);
  const [filterAssessmentsBy, setFilterAssessmentsBy] = useState<string>("Active");
  
  // Dialog state for assessment details
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessmentData | null>(null);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);

  // Consolidated fetchRiskAssessments function
  const fetchRiskAssessments = async () => {
    const response = await RiskAssessmentApi.getRiskAssessments()
    if (response && response.status && Array.isArray(response.data)) {
      setRiskAssessments(response.data)
    } else {
      // Fallback if the response structure is unexpected
      setRiskAssessments([])
    }
  }

  useEffect(() => {
    setFilterAssessmentsBy("Active");
    fetchRiskAssessments()
  }, [])

  useEffect(() => {
    let filteredAssessments = riskAssessments
    if (filterAssessmentsBy !== "Disabled") {
      filteredAssessments = filteredAssessments.filter((assessment) => assessment.status === filterAssessmentsBy)
    }
      // Apply search filter if search query exists
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        filteredAssessments = filteredAssessments.filter((assessment) => {
          return (
            (assessment.id && assessment.id.toString().includes(query)) ||
            (assessment.scopeOfWork && assessment.scopeOfWork.toLowerCase().includes(query)) ||
            (assessment.assetSystem && assessment.assetSystem.toLowerCase().includes(query)) ||
            (assessment.individuals && assessment.individuals.toLowerCase().includes(query)) ||
            (assessment.supervisor && assessment.supervisor.toLowerCase().includes(query)) ||
            (assessment.location && assessment.location.toLowerCase().includes(query)) ||
            (assessment.status && assessment.status.toLowerCase().includes(query)) ||
            (assessment.risks && assessment.risks.some(risk => 
              (risk.riskDescription && risk.riskDescription.toLowerCase().includes(query)) ||
              (risk.riskType && risk.riskType.toLowerCase().includes(query))
            ))
          )
        })  
      }
      
      setFilterAssessments(filteredAssessments)
    
  }, [riskAssessments, filterAssessmentsBy, searchQuery])

  const handleFormSuccess = () => {
    // Refresh the risk assessments data after successful edit
    fetchRiskAssessments()
  }

  return (
    <AnalyticsPageWrapper
      title="Risk Assessment Analytics"
      searchPlaceholder="Search assessments..."
      filteredData={filterAssessments}
      onSearchChange={setSearchQuery}
      onStatusFilterChange={setFilterAssessmentsBy}
      onMarkerClick={(assessment) => {
        setSelectedAssessment(assessment);
        setIsAssessmentDialogOpen(true);
      }}
      mapId="risk-assessment-analytics-map"
      dataKey="assessment"
      itemCountText={`Showing ${filterAssessments.length} risk assessment${filterAssessments.length !== 1 ? 's' : ''}`}
      currentStatusFilter={filterAssessmentsBy}
    >
      <RiskAssessmentForm
        open={open}
        onOpenChange={setOpen}
        mode="edit"
        assessment={editingAssessment}
        onSuccess={handleFormSuccess}
      />

      <MapInfoDialog
        title="Risk Assessment Details"
        data={selectedAssessment ? selectedAssessment : null}
        isOpen={isAssessmentDialogOpen}
        onClose={() => {
          setIsAssessmentDialogOpen(false);
          setSelectedAssessment(null);
        }}
        onEdit={() => {
          setEditingAssessment(selectedAssessment)
          setOpen(true)
        }}
      />
    </AnalyticsPageWrapper>
  )
} 