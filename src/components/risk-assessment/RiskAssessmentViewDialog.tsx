"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { RiskAssessment } from "@/types"
import { getRiskColorPastel, getRiskScore, getConsequenceLabels } from "@/lib/risk-utils"
import { MapPin, Calendar, AlertTriangle, Users, ShieldCheck, CircleDot } from "lucide-react"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

interface RiskAssessmentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: RiskAssessment | null;
  onEdit: () => void;
}

export function RiskAssessmentViewDialog({
  open,
  onOpenChange,
  assessment,
  onEdit,
}: RiskAssessmentViewDialogProps) {
  if (!assessment) return null;

  const rejectionComments = assessment.latestApproval?.status === 'rejected' 
    ? assessment.latestApproval?.comments?.split('Comments: ').at(-1) || "No comments"
    : null;

  const riskCount = assessment.risks?.length || 0;
  const highRiskCount = assessment.risks?.filter(r => r.requiresSupervisorSignature).length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl mx-auto h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 gap-0">
        <VisuallyHidden.Root>
          <DialogTitle>Risk Assessment Details</DialogTitle>
        </VisuallyHidden.Root>
        
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 border-b bg-gray-50/50">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>Risk Assessment</span>
                <span>•</span>
                <span>ID: {assessment.id}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                {assessment.scopeOfWork || "Untitled Assessment"}
              </h2>
            </div>
            <StatusBadge status={assessment.status} />
          </div>

          {/* Quick Stats Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="truncate max-w-[200px]">{assessment.location || "No location"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>{assessment.date} {assessment.time && `at ${assessment.time}`}</span>
            </div>
            {riskCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
                <span>{riskCount} risk{riskCount !== 1 ? 's' : ''}</span>
                {highRiskCount > 0 && (
                  <span className="text-amber-600 font-medium">({highRiskCount} high)</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Rejection Notice */}
          {rejectionComments && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800 text-sm">Assessment Rejected</p>
                  <p className="text-red-700 text-sm mt-0.5">{rejectionComments}</p>
                </div>
              </div>
            </div>
          )}

          {/* Details Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assignment Card */}
            <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Assignment</h3>
              <div className="space-y-2 min-w-max">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Individual/Team</p>
                    <IndividualsList individuals={assessment.individuals} />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Supervisor</p>
                    <p className="text-sm text-gray-900 whitespace-nowrap">{assessment.supervisor || "Not assigned"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Details Card */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Work Details</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CircleDot className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Asset System</p>
                    <p className="text-sm text-gray-900 truncate">{assessment.assetSystem || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-gray-900 truncate">{assessment.location || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risks Section */}
          {assessment.risks && assessment.risks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Risks & Controls
              </h3>
              <div className="space-y-3">
                {assessment.risks.map((risk, index) => {
                  const asIsScore = getRiskScore(
                    risk.asIsLikelihood || 'Very Unlikely',
                    risk.asIsConsequence || 'Minor',
                    getConsequenceLabels(risk.riskType || 'Personnel')
                  );
                  const mitigatedScore = getRiskScore(
                    risk.mitigatedLikelihood || 'Very Unlikely',
                    risk.mitigatedConsequence || 'Minor',
                    getConsequenceLabels(risk.riskType || 'Personnel')
                  );
                  const asIsColorClasses = getRiskColorPastel(asIsScore, risk.riskType || 'Personnel');
                  const mitigatedColorClasses = getRiskColorPastel(mitigatedScore, risk.riskType || 'Personnel');

                  return (
                    <div key={risk.id || index} className="border rounded-lg overflow-hidden">
                      {/* Risk Header */}
                      <div className="px-4 py-3 bg-gray-50 border-b">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-500">
                                Risk {index + 1} • {risk.riskType || "Unspecified"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900">
                              {risk.riskDescription || "No description"}
                            </p>
                          </div>
                          {risk.requiresSupervisorSignature && (
                            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex-shrink-0">
                              Supervisor Required
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Risk Scores - Side by Side */}
                      <div className="grid grid-cols-2 divide-x">
                        <div className="p-3">
                          <p className="text-xs text-gray-500 mb-1.5">Initial Risk</p>
                          <div className={`${asIsColorClasses} rounded px-2.5 py-1.5 inline-flex items-center gap-2`}>
                            <span className="font-semibold text-sm">{asIsScore}</span>
                            <span className="text-xs opacity-75">
                              {risk.asIsLikelihood} / {risk.asIsConsequence}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-gray-500 mb-1.5">After Mitigation</p>
                          <div className={`${mitigatedColorClasses} rounded px-2.5 py-1.5 inline-flex items-center gap-2`}>
                            <span className="font-semibold text-sm">{mitigatedScore}</span>
                            <span className="text-xs opacity-75">
                              {risk.mitigatedLikelihood} / {risk.mitigatedConsequence}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mitigation Action */}
                      {risk.mitigatingAction && (
                        <div className="px-4 py-3 bg-blue-50/50 border-t">
                          <div className="flex items-start gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-blue-700 font-medium">
                                Mitigation: {risk.mitigatingActionType || "Control"}
                              </p>
                              <p className="text-sm text-blue-900 mt-0.5">
                                {risk.mitigatingAction}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No risks message */}
          {(!assessment.risks || assessment.risks.length === 0) && (
            <div className="border border-dashed rounded-lg p-4 text-center text-gray-500 text-sm">
              No risks have been added to this assessment.
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="sm:w-auto"
          >
            Close
          </Button>
          <Button 
            type="button"
            className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 sm:w-auto"
            onClick={onEdit}
          >
            Edit Assessment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 ring-green-600/20';
      case 'Pending':
        return 'bg-amber-100 text-amber-700 ring-amber-600/20';
      case 'Rejected':
        return 'bg-red-100 text-red-700 ring-red-600/20';
      case 'Completed':
        return 'bg-blue-100 text-blue-700 ring-blue-600/20';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700 ring-gray-600/20';
      default:
        return 'bg-gray-100 text-gray-700 ring-gray-600/20';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getStatusStyles()}`}>
      {status || 'Active'}
    </span>
  );
}

// Individuals List Component - handles string, array, or comma-separated values
function IndividualsList({ individuals }: { individuals: string | string[] | undefined }) {
  if (!individuals) {
    return <p className="text-sm text-gray-900">Not assigned</p>;
  }

  // Parse individuals - could be array, comma-separated string, or single value
  let individualsList: string[];
  
  if (Array.isArray(individuals)) {
    individualsList = individuals;
  } else if (typeof individuals === 'string') {
    // Check if it's comma-separated
    individualsList = individuals.includes(',') 
      ? individuals.split(',').map(i => i.trim()).filter(Boolean)
      : [individuals];
  } else {
    return <p className="text-sm text-gray-900">Not assigned</p>;
  }

  if (individualsList.length === 0) {
    return <p className="text-sm text-gray-900">Not assigned</p>;
  }

  if (individualsList.length === 1) {
    return <p className="text-sm text-gray-900 whitespace-nowrap">{individualsList[0]}</p>;
  }

  // Multiple individuals - show as a list (parent handles scrolling)
  return (
    <div className="space-y-0.5">
      {individualsList.map((individual, index) => (
        <p key={index} className="text-sm text-gray-900 whitespace-nowrap">
          {individual}
        </p>
      ))}
    </div>
  );
}
