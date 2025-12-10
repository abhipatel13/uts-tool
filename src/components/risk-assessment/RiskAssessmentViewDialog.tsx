"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { RiskAssessment } from "@/types"
import { getRiskColorPastel, getRiskScore, getConsequenceLabels } from "@/lib/risk-utils"

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl mx-auto h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Risk Assessment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rejection Notice - Prominent display */}
          {rejectionComments && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-red-600 text-lg">⚠️</span>
                <div>
                  <h4 className="font-medium text-red-800">Assessment Rejected</h4>
                  <p className="text-red-700 text-sm mt-1">{rejectionComments}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ViewField label="Date" value={assessment.date} />
            <ViewField label="Time" value={assessment.time} />
            <ViewField 
              label="Status" 
              value={
                <StatusBadge status={assessment.status} />
              } 
            />
            <ViewField label="ID" value={assessment.id} />
          </div>

          {/* Scope of Work */}
          <ViewField 
            label="Scope of Work" 
            value={assessment.scopeOfWork} 
            fullWidth 
          />

          {/* Asset and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ViewField label="Asset System" value={assessment.assetSystem} />
            <ViewField label="Location" value={assessment.location} />
          </div>

          {/* Personnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ViewField 
              label="Individual/Team" 
              value={assessment.individuals || "N/A"} 
            />
            <ViewField 
              label="Supervisor" 
              value={assessment.supervisor || "N/A"} 
            />
          </div>

          {/* Risks Section */}
          {assessment.risks && assessment.risks.length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Risks and Controls</Label>
              <div className="space-y-4">
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
                    <div key={risk.id || index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">Risk {index + 1}</h4>
                        {risk.requiresSupervisorSignature && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                            Supervisor Signature Required
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <ViewField 
                          label="Risk Description" 
                          value={risk.riskDescription || "N/A"} 
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ViewField 
                            label="Risk Type" 
                            value={risk.riskType || "N/A"} 
                          />
                          <div>
                            <Label className="text-xs text-gray-600 font-medium">Associated Risk</Label>
                            <div className={`${asIsColorClasses} border rounded-lg p-3 mt-1`}>
                              <div className="text-xs sm:text-sm font-medium">
                                Score: {asIsScore}
                              </div>
                              {risk.asIsLikelihood && risk.asIsConsequence && (
                                <div className="text-xs mt-1 opacity-75">
                                  {risk.asIsLikelihood} • {risk.asIsConsequence}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <ViewField 
                          label="Mitigating Action" 
                          value={risk.mitigatingAction || "N/A"} 
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ViewField 
                            label="Mitigating Action Type" 
                            value={risk.mitigatingActionType || "N/A"} 
                          />
                          <div>
                            <Label className="text-xs text-gray-600 font-medium">Post-Mitigation Risk</Label>
                            <div className={`${mitigatedColorClasses} border rounded-lg p-3 mt-1`}>
                              <div className="text-xs sm:text-sm font-medium">
                                Score: {mitigatedScore}
                              </div>
                              {risk.mitigatedLikelihood && risk.mitigatedConsequence && (
                                <div className="text-xs mt-1 opacity-75">
                                  {risk.mitigatedLikelihood} • {risk.mitigatedConsequence}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No risks message */}
          {(!assessment.risks || assessment.risks.length === 0) && (
            <div className="border rounded-lg p-4 text-center text-gray-500">
              No risks have been added to this assessment.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 w-full sm:w-auto"
            >
              Close
            </Button>
            <Button 
              type="button"
              className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 h-11 px-6 w-full sm:w-auto"
              onClick={onEdit}
            >
              Edit Assessment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for displaying read-only fields
interface ViewFieldProps {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

function ViewField({ label, value, fullWidth }: ViewFieldProps) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <Label className="text-xs text-gray-600 font-medium">{label}</Label>
      <div className="text-sm text-gray-900 mt-1 break-words">
        {value || "N/A"}
      </div>
    </div>
  );
}

// Helper component for status badge
function StatusBadge({ status }: { status: string }) {
  const getStatusClasses = () => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-amber-100 text-amber-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {status || 'Active'}
    </span>
  );
}





