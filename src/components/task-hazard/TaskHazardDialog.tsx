"use client"

import { useState, useEffect } from 'react'
import type { TaskHazard } from "@/types"
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
 */
export function TaskHazardDialog({
  open,
  onOpenChange,
  initialMode,
  task,
  onSuccess,
}: TaskHazardDialogProps) {
  const [currentMode, setCurrentMode] = useState<TaskHazardDialogMode>(initialMode);

  // Reset mode when dialog opens/closes or initialMode changes
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
      // Reset to initial mode when closing
      setCurrentMode(initialMode);
    }
    onOpenChange(isOpen);
  };

  // View mode
  if (currentMode === 'view' && task) {
    return (
      <TaskHazardViewDialog
        open={open}
        onOpenChange={handleClose}
        task={task}
        onEdit={handleSwitchToEdit}
      />
    );
  }

  // Edit or Create mode
  return (
    <TaskHazardForm
      open={open}
      onOpenChange={handleClose}
      mode={currentMode === 'create' ? 'create' : 'edit'}
      task={task}
      onSuccess={handleFormSuccess}
    />
  );
}





