"use client"

import { useEffect, useState } from "react"
import { TaskHazardApi } from "@/services"
import type { TaskHazard, Risk } from "@/types"
import TaskHazardForm from "@/components/TaskHazardForm"
import { MapInfoDialog } from "@/components/analytics/MapInfoDialog"
import { AnalyticsPageWrapper } from "@/components/analytics/AnalyticsPageWrapper"

export default function TaskHazardAnalytics() {
  const [open, setOpen] = useState(false)
  const [editingHazard, setEditingHazard] = useState<TaskHazard | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [taskHazards, setTaskHazards] = useState<TaskHazard[]>([]);
  const [filterHazards, setFilterHazards] = useState<TaskHazard[]>([]);
  const [filterHazardsBy, setFilterHazardsBy] = useState<string>("Active");
  
  // Dialog state for hazard details
  const [selectedHazard, setSelectedHazard] = useState<TaskHazard | null>(null);
  const [isHazardDialogOpen, setIsHazardDialogOpen] = useState(false);

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
            (hazard.individual && hazard.individual.toLowerCase().includes(query)) ||
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
        setIsHazardDialogOpen(true);
      }}
      mapId="task-hazard-analytics-map"
      dataKey="hazard"
      itemCountText={`Showing ${filterHazards.length} task hazard${filterHazards.length !== 1 ? 's' : ''}`}
      currentStatusFilter={filterHazardsBy}
    >
      <TaskHazardForm
        open={open}
        onOpenChange={setOpen}
        mode="edit"
        task={editingHazard}
        onSuccess={handleFormSuccess}
      />

      <MapInfoDialog
        title="Task Hazard Details"
        data={selectedHazard}
        isOpen={isHazardDialogOpen}
        onClose={() => {
          setIsHazardDialogOpen(false);
          setSelectedHazard(null);
        }}
        onEdit={() => {
          setEditingHazard(selectedHazard)
          setOpen(true)
        }}
      />
    </AnalyticsPageWrapper>
  )
}