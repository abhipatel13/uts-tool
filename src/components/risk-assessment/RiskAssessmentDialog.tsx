"use client"

import { useState, useEffect } from 'react'
import type { RiskAssessment } from "@/types"
import { RiskAssessmentViewDialog } from './RiskAssessmentViewDialog'
import RiskAssessmentForm from './RiskAssessmentForm'
import { useRiskAssessment } from '@/hooks/useRiskAssessments'

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
 * Uses React Query for caching - reopening the same assessment is instant.
 */
export function RiskAssessmentDialog({
  open,
  onOpenChange,
  initialMode,
  assessment,
  onSuccess,
}: RiskAssessmentDialogProps) {
  const [currentMode, setCurrentMode] = useState<RiskAssessmentDialogMode>(initialMode);

  // Use React Query to fetch full assessment data (with caching)
  const assessmentId = assessment?.id?.toString() || null;
  const shouldFetch = open && (currentMode === 'view' || currentMode === 'edit') && !!assessmentId;
  
  const { 
    data: fullAssessmentData, 
    isLoading,
  } = useRiskAssessment(assessmentId, { 
    enabled: shouldFetch 
  });

  // Use fetched data if available, otherwise fall back to passed assessment
  const fullAssessment = fullAssessmentData || assessment;

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
      <RiskAssessmentForm
        open={open}
        onOpenChange={handleClose}
        mode="create"
        assessment={null}
        onSuccess={handleFormSuccess}
      />
    );
  }

  // View mode
  if (currentMode === 'view') {
    return (
      <RiskAssessmentViewDialog
        open={open}
        onOpenChange={handleClose}
        assessment={isLoading ? (assessment ?? null) : (fullAssessment ?? null)}
        onEdit={handleSwitchToEdit}
      />
    );
  }

  // Edit mode
  return (
    <RiskAssessmentForm
      open={open}
      onOpenChange={handleClose}
      mode="edit"
      assessment={fullAssessment as RiskAssessment | null}
      onSuccess={handleFormSuccess}
    />
  );
}
