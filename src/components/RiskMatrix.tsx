"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  riskCategories,
  personnelConsequenceLabels,
  likelihoodLabels,
  riskLevelIndicators,
  getRiskScore,
  getRiskColor,
  getConsequenceLabels
} from "@/lib/risk-utils"
import type { Risk } from "@/services/api"

interface RiskMatrixProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskId: string | null;
  isAsIsMatrix: boolean;
  risk: Risk | null;
  onRiskUpdate: (riskId: string, updates: Partial<Risk>) => void;
}

export function RiskMatrix({
  open,
  onOpenChange,
  riskId,
  isAsIsMatrix,
  risk,
  onRiskUpdate
}: RiskMatrixProps) {
  const [enableSupervisorSignature, setEnableSupervisorSignature] = useState(true)
  const [activeConsequenceLabels, setActiveConsequenceLabels] = useState(personnelConsequenceLabels)

  // Update consequence labels when risk type changes
  useEffect(() => {
    if (risk) {
      setActiveConsequenceLabels(getConsequenceLabels(risk.riskType));
    }
  }, [risk?.riskType]);

  const handleRiskMatrixClick = (likelihood: string, consequence: string, score: number) => {
    if (!risk || !riskId) return;

    console.log('Current Risk:', risk);
    console.log('Score:', score);

    // Create updates based on whether it's as-is or mitigated
    const updates: Partial<Risk> = isAsIsMatrix
      ? { 
          asIsLikelihood: likelihood,
          asIsConsequence: consequence,
        }
      : {
          mitigatedLikelihood: likelihood,
          mitigatedConsequence: consequence,
          requiresSupervisorSignature: (risk.riskType === "Maintenance")
            ? enableSupervisorSignature && score >= 16
            : enableSupervisorSignature && score > 9
        };

    console.log('Risk Updates:', updates);

    // Call the parent update function
    onRiskUpdate(riskId, updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAsIsMatrix ? 'Associated Risks' : 'Post-Mitigation Risk Assessment'} - {
              risk?.riskType || 'Risk'
            } Assessment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Configuration Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAsIsMatrix ? (
                <Label>Risk Assessment</Label>
              ) : (
                <div className="flex items-center gap-2">
                  <Label>Supervisor Signature Required for High Risk ({'>'}9)</Label>
                  <select
                    className="rounded-md border border-input px-3 py-1 text-sm"
                    value={enableSupervisorSignature.toString()}
                    onChange={(e) => setEnableSupervisorSignature(e.target.value === 'true')}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            {!isAsIsMatrix && risk?.requiresSupervisorSignature && (
              <div className="text-amber-600 flex items-center gap-2">
                <span className="text-sm font-medium">⚠️ Supervisor Signature Required - Status will remain pending until approved</span>
              </div>
            )}
          </div>

          {/* Selected Risk Type */}
          {risk && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Risk Type:</span>
              <div className={`px-4 py-2 rounded-md ${
                riskCategories.find(c => c.id === risk.riskType)?.color || 'bg-gray-200'
              }`}>
                {risk.riskType || 'Not Selected'}
              </div>
            </div>
          )}

          {/* Risk Matrix Grid */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-6 divide-x divide-y">
              {/* Header */}
              <div className="bg-white p-4 font-medium">
                Probability / Severity
              </div>
              {activeConsequenceLabels.map((consequence) => (
                <div key={consequence.value} className="bg-white p-2 text-center">
                  <div className="font-medium">{consequence.label}</div>
                  <div className="text-xs text-gray-500">{consequence.description}</div>
                  <div className="text-xs font-medium mt-1">{consequence.score}</div>
                </div>
              ))}

              {/* Matrix Rows */}
              {likelihoodLabels.map((likelihood) => (
                <React.Fragment key={likelihood.value}>
                  <div className="bg-white p-2">
                    <div className="font-medium">{likelihood.label}</div>
                    <div className="text-xs text-gray-500">{likelihood.description}</div>
                    <div className="text-xs font-medium mt-1">{likelihood.score}</div>
                  </div>
                  {activeConsequenceLabels.map((consequence) => {
                    const score = getRiskScore(likelihood.value, consequence.value, activeConsequenceLabels);
                    
                    const isSelected = isAsIsMatrix
                      ? risk?.asIsLikelihood === likelihood.value && 
                        risk?.asIsConsequence === consequence.value
                      : risk?.mitigatedLikelihood === likelihood.value && 
                        risk?.mitigatedConsequence === consequence.value;

                    return (
                      <button
                        key={`${likelihood.value}-${consequence.value}`}
                        type="button"
                        className={`${getRiskColor(score, risk?.riskType || '')} 
                          aspect-square flex items-center justify-center font-medium text-2xl
                          ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : ''}
                          hover:opacity-90 transition-opacity cursor-pointer`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRiskMatrixClick(likelihood.value, consequence.value, score);
                        }}
                      >
                        {score}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              {(() => {
                const riskType = risk?.riskType || "Personnel";
                const indicators = riskLevelIndicators[riskType as keyof typeof riskLevelIndicators] || riskLevelIndicators.Personnel;
                
                return (
                  <>
                    {indicators.map((indicator, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className={`w-4 h-4 ${indicator.color} rounded`}></div>
                        <span className="text-sm">{indicator.label}</span>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 