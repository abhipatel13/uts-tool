"use client"

import { useState, useEffect } from 'react'
import type { TaskHazard } from "@/types"
import { TaskHazardViewDialog } from './TaskHazardViewDialog'
import TaskHazardForm from './TaskHazardForm'
import { useTaskHazard } from '@/hooks/useTaskHazards'

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
 * Uses React Query for caching - reopening the same task is instant.
 */
export function TaskHazardDialog({
  open,
  onOpenChange,
  initialMode,
  task,
  onSuccess,
}: TaskHazardDialogProps) {
  const [currentMode, setCurrentMode] = useState<TaskHazardDialogMode>(initialMode);

  // Use React Query to fetch full task data (with caching)
  const taskId = task?.id?.toString() || null;
  const shouldFetch = open && (currentMode === 'view' || currentMode === 'edit') && !!taskId;
  
  const { 
    data: fullTaskData, 
    isLoading,
  } = useTaskHazard(taskId, { 
    enabled: shouldFetch 
  });

  // Use fetched data if available, otherwise fall back to passed task
  const fullTask = fullTaskData || task;

  // Reset mode when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentMode(initialMode);
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
    }
    onOpenChange(isOpen);
  };

  // Create mode - no need to fetch
  if (currentMode === 'create') {
    return (
      <TaskHazardForm
        open={open}
        onOpenChange={handleClose}
        mode="create"
        task={null}
        onSuccess={handleFormSuccess}
      />
    );
  }

  // View mode
  if (currentMode === 'view') {
    return (
      <TaskHazardViewDialog
        open={open}
        onOpenChange={handleClose}
        task={isLoading ? (task ?? null) : (fullTask ?? null)}
        onEdit={handleSwitchToEdit}
      />
    );
  }

  // Edit mode
  return (
    <TaskHazardForm
      open={open}
      onOpenChange={handleClose}
      mode="edit"
      task={fullTask as TaskHazard | null}
      onSuccess={handleFormSuccess}
    />
  );
}
