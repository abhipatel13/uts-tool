"use client"

import { useState, useEffect } from 'react'
import type { TaskHazard } from "@/types"
import { TaskHazardApi } from "@/services"
import { TaskHazardViewDialog } from './TaskHazardViewDialog'
import TaskHazardForm from './TaskHazardForm'

export type TaskHazardDialogMode = 'view' | 'edit' | 'create';

interface TaskHazardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode: TaskHazardDialogMode;
  task?: TaskHazard | null;
  onSuccess?: () => void;
}

/**
 * Wrapper component that manages transitions between view and edit modes
 * for TaskHazard dialogs. Provides seamless UX when switching modes.
 * Automatically fetches full data when opening in view mode with partial data.
 */
export function TaskHazardDialog({
  open,
  onOpenChange,
  initialMode,
  task,
  onSuccess,
}: TaskHazardDialogProps) {
  const [currentMode, setCurrentMode] = useState<TaskHazardDialogMode>(initialMode);
  const [fullTask, setFullTask] = useState<TaskHazard | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we have complete data (risks array exists)
  const hasCompleteData = (data: TaskHazard | null | undefined): boolean => {
    if (!data) return false;
    // Consider data complete if risks array exists (even if empty) and is an actual array
    return Array.isArray(data.risks);
  };

  // Fetch full data when opening in view mode with partial data
  useEffect(() => {
    if (open && initialMode === 'view' && task?.id && !hasCompleteData(task)) {
      setIsLoading(true);
      TaskHazardApi.getTaskHazard(task.id.toString())
        .then((response) => {
          if (response && response.status && response.data) {
            setFullTask(response.data);
          } else {
            // Fallback to partial data if fetch fails
            setFullTask(task);
          }
        })
        .catch((error) => {
          console.error('Error fetching full task hazard data:', error);
          // Fallback to partial data if fetch fails
          setFullTask(task);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (open && task) {
      // Use provided data if it's already complete
      setFullTask(task);
    }
  }, [open, initialMode, task]);

  // Reset mode and data when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentMode(initialMode);
      setFullTask(null);
    }
  }, [open, initialMode]);

  // Update mode when initialMode changes while open
  useEffect(() => {
    if (open) {
      setCurrentMode(initialMode);
    }
  }, [open, initialMode]);

  const handleSwitchToEdit = () => {
    setCurrentMode('edit');
  };

  const handleFormSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentMode(initialMode);
      setFullTask(null);
    }
    onOpenChange(isOpen);
  };

  // Loading state while fetching full data
  if (currentMode === 'view' && isLoading) {
    return (
      <TaskHazardViewDialog
        open={open}
        onOpenChange={handleClose}
        task={task || null}
        onEdit={handleSwitchToEdit}
      />
    );
  }

  // View mode with full data
  if (currentMode === 'view' && (fullTask || task)) {
    return (
      <TaskHazardViewDialog
        open={open}
        onOpenChange={handleClose}
        task={fullTask || task || null}
        onEdit={handleSwitchToEdit}
      />
    );
  }

  // Edit or Create mode - use full data if available
  return (
    <TaskHazardForm
      open={open}
      onOpenChange={handleClose}
      mode={currentMode === 'create' ? 'create' : 'edit'}
      task={fullTask || task}
      onSuccess={handleFormSuccess}
    />
  );
}





