"use client"

import { useState, useEffect } from 'react'
import type { RiskAssessment } from "@/types"
import { RiskAssessmentViewDialog } from './RiskAssessmentViewDialog'
import RiskAssessmentForm from './RiskAssessmentForm'

export type RiskAssessmentDialogMode = 'view' | 'edit' | 'create';

interface RiskAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode: RiskAssessmentDialogMode;
  assessment?: RiskAssessment | null;
  onSuccess?: () => void;
}

/**
 * Wrapper component that manages transitions between view and edit modes
 * for RiskAssessment dialogs. Provides seamless UX when switching modes.
 */
export function RiskAssessmentDialog({
  open,
  onOpenChange,
  initialMode,
  assessment,
  onSuccess,
}: RiskAssessmentDialogProps) {
  const [currentMode, setCurrentMode] = useState<RiskAssessmentDialogMode>(initialMode);

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
  if (currentMode === 'view' && assessment) {
    return (
      <RiskAssessmentViewDialog
        open={open}
        onOpenChange={handleClose}
        assessment={assessment}
        onEdit={handleSwitchToEdit}
      />
    );
  }

  // Edit or Create mode
  return (
    <RiskAssessmentForm
      open={open}
      onOpenChange={handleClose}
      mode={currentMode === 'create' ? 'create' : 'edit'}
      assessment={assessment}
      onSuccess={handleFormSuccess}
    />
  );
}





