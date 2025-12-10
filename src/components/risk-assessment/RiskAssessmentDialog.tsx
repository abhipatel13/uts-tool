"use client"

import { useState, useEffect } from 'react'
import type { RiskAssessment } from "@/types"
import { RiskAssessmentApi } from "@/services"
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
 * Automatically fetches full data when opening in view mode with partial data.
 */
export function RiskAssessmentDialog({
  open,
  onOpenChange,
  initialMode,
  assessment,
  onSuccess,
}: RiskAssessmentDialogProps) {
  const [currentMode, setCurrentMode] = useState<RiskAssessmentDialogMode>(initialMode);
  const [fullAssessment, setFullAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we have complete data (risks array exists and has content or latestApproval exists)
  const hasCompleteData = (data: RiskAssessment | null | undefined): boolean => {
    if (!data) return false;
    // Consider data complete if risks array exists (even if empty) and is an actual array
    return Array.isArray(data.risks);
  };

  // Fetch full data when opening in view mode with partial data
  useEffect(() => {
    if (open && initialMode === 'view' && assessment?.id && !hasCompleteData(assessment)) {
      setIsLoading(true);
      RiskAssessmentApi.getRiskAssessment(assessment.id.toString())
        .then((response) => {
          if (response && response.status && response.data) {
            setFullAssessment(response.data);
          } else {
            // Fallback to partial data if fetch fails
            setFullAssessment(assessment);
          }
        })
        .catch((error) => {
          console.error('Error fetching full assessment data:', error);
          // Fallback to partial data if fetch fails
          setFullAssessment(assessment);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (open && assessment) {
      // Use provided data if it's already complete
      setFullAssessment(assessment);
    }
  }, [open, initialMode, assessment]);

  // Reset mode and data when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentMode(initialMode);
      setFullAssessment(null);
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
      setFullAssessment(null);
    }
    onOpenChange(isOpen);
  };

  // Loading state while fetching full data
  if (currentMode === 'view' && isLoading) {
    return (
      <RiskAssessmentViewDialog
        open={open}
        onOpenChange={handleClose}
        assessment={assessment || null}
        onEdit={handleSwitchToEdit}
      />
    );
  }

  // View mode with full data
  if (currentMode === 'view' && (fullAssessment || assessment)) {
    return (
      <RiskAssessmentViewDialog
        open={open}
        onOpenChange={handleClose}
        assessment={fullAssessment || assessment || null}
        onEdit={handleSwitchToEdit}
      />
    );
  }

  // Edit or Create mode - use full data if available
  return (
    <RiskAssessmentForm
      open={open}
      onOpenChange={handleClose}
      mode={currentMode === 'create' ? 'create' : 'edit'}
      assessment={fullAssessment || assessment}
      onSuccess={handleFormSuccess}
    />
  );
}





