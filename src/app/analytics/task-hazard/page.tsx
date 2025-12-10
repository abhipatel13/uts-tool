"use client"

import { useEffect, useState } from "react"
import { TaskHazardApi } from "@/services"
import type { TaskHazard, Risk } from "@/types"
import { TaskHazardDialog, type TaskHazardDialogMode } from "@/components/task-hazard"
import { AnalyticsPageWrapper } from "@/components/analytics/AnalyticsPageWrapper"

export default function TaskHazardAnalytics() {
  const [searchQuery, setSearchQuery] = useState("")

  const [taskHazards, setTaskHazards] = useState<TaskHazard[]>([]);
  const [filterHazards, setFilterHazards] = useState<TaskHazard[]>([]);
  const [filterHazardsBy, setFilterHazardsBy] = useState<string>("Active");
  
  // Dialog state - unified for view/edit
  const [selectedHazard, setSelectedHazard] = useState<TaskHazard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<TaskHazardDialogMode>('view');

  // Consolidated fetchTaskHazards function
  const fetchTaskHazards = async () => {
    const response = await TaskHazardApi.getTaskHazards()
    if (response && response.status && Array.isArray(response.data)) {
      setTaskHazards(response.data)
    } else {
      // Fallback if the response structure is unexpected
      setTaskHazards([])
    }
  }

  useEffect(() => {
    setFilterHazardsBy("Active");
    fetchTaskHazards()
  }, [])

  useEffect(() => {
    let filteredHazards = taskHazards
    if (filterHazardsBy !== "Disabled") {
      filteredHazards = filteredHazards.filter((hazard) => hazard.status === filterHazardsBy)
    }
      // Apply search filter if search query exists
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        filteredHazards = filteredHazards.filter((hazard) => {
          return (
            (hazard.id && hazard.id.toString().includes(query)) ||
            (hazard.scopeOfWork && hazard.scopeOfWork.toLowerCase().includes(query)) ||
            (hazard.assetSystem && hazard.assetSystem.toLowerCase().includes(query)) ||
            (hazard.individuals && hazard.individuals.toLowerCase().includes(query)) ||
            (hazard.supervisor && hazard.supervisor.toLowerCase().includes(query)) ||
            (hazard.location && hazard.location.toLowerCase().includes(query)) ||
            (hazard.status && hazard.status.toLowerCase().includes(query)) ||
            (hazard.risks && hazard.risks.some((risk: Risk) => 
              (risk.riskDescription && risk.riskDescription.toLowerCase().includes(query)) ||
              (risk.riskType && risk.riskType.toLowerCase().includes(query))
            ))
          )
        })  
      }
      
      setFilterHazards(filteredHazards)
    
  }, [taskHazards, filterHazardsBy, searchQuery])

  const handleFormSuccess = () => {
    // Refresh the task hazards data after successful edit
    fetchTaskHazards()
  }

  return (
    <AnalyticsPageWrapper
      title="Task Hazard Analytics"
      searchPlaceholder="Search hazards..."
      filteredData={filterHazards}
      onSearchChange={setSearchQuery}
      onStatusFilterChange={setFilterHazardsBy}
      onMarkerClick={(hazard) => {
        setSelectedHazard(hazard);
        setDialogMode('view');
        setIsDialogOpen(true);
      }}
      mapId="task-hazard-analytics-map"
      dataKey="hazard"
      itemCountText={`Showing ${filterHazards.length} task hazard${filterHazards.length !== 1 ? 's' : ''}`}
      currentStatusFilter={filterHazardsBy}
    >
      <TaskHazardDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedHazard(null);
          }
        }}
        initialMode={dialogMode}
        task={selectedHazard}
        onSuccess={handleFormSuccess}
      />
    </AnalyticsPageWrapper>
  )
}