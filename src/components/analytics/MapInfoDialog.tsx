"use client"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { TaskHazard, RiskAssessment } from "@/types";
import { getRiskColorPastel, getRiskScore, getConsequenceLabels } from "@/lib/risk-utils";


export const MapInfoDialog = ({ 
    title,
    data, 
    isOpen,
    onClose,
    onEdit
  }: {
    title: string;
    data: TaskHazard | RiskAssessment | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
  }) => {
    if (!data) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[90vw] max-w-[500px] max-h-[85vh] overflow-y-auto rounded-lg mx-auto my-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg text-gray-800">
              {title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-sm sm:text-base">
            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600 text-xs sm:text-sm">ID:</span>
                <div className="text-gray-900 break-words">{data.id || 'N/A'}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600 text-xs sm:text-sm">Status:</span>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    data.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : data.status === 'Pending'
                      ? 'bg-amber-100 text-amber-800'
                      : data.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {data.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
  
            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600 text-xs sm:text-sm">Date:</span>
                <div className="text-gray-900">{data.date || 'N/A'}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600 text-xs sm:text-sm">Time:</span>
                <div className="text-gray-900">{data.time || 'N/A'}</div>
              </div>
            </div>
  
            {/* Work Details */}
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">Scope of Work:</span>
              <div className="text-gray-900 break-words mt-1">{data.scopeOfWork || 'N/A'}</div>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">Asset System:</span>
              <div className="text-gray-900 break-words mt-1">{data.assetSystem || 'N/A'}</div>
            </div>
  
            {/* Personnel */}
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-600 text-xs sm:text-sm">Individuals:</span>
                <div className="text-gray-900 break-words mt-1">{data.individuals || 'N/A'}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600 text-xs sm:text-sm">Supervisor:</span>
                <div className="text-gray-900 break-words mt-1">{data.supervisor || 'N/A'}</div>
              </div>
            </div>
  
            {/* Risks Section */}
            {data.risks && data.risks.length > 0 && (
              <div>
                <span className="font-medium text-gray-600 text-xs sm:text-sm">Associated Risks:</span>
                <div className="mt-2 space-y-2">
                  {data.risks.map((risk, index) => {
                    // Calculate risk score and color using asIs values
                    const riskScore = getRiskScore(
                      risk.asIsLikelihood || 'Very Unlikely',
                      risk.asIsConsequence || 'Minor',
                      getConsequenceLabels(risk.riskType || 'Personnel')
                    );
                    const riskColorClasses = getRiskColorPastel(riskScore, risk.riskType || 'Personnel');
                    
                    return (
                      <div key={index} className={`${riskColorClasses} border rounded-lg p-3`}>
                        <div className="text-xs sm:text-sm font-medium">
                          {risk.riskType || 'Unknown Risk Type'} (Score: {riskScore})
                        </div>
                        <div className="text-xs sm:text-sm mt-1 break-words opacity-90">
                          {risk.riskDescription || 'No description available'}
                        </div>
                        {risk.asIsLikelihood && risk.asIsConsequence && (
                          <div className="text-xs mt-2 opacity-75">
                            Likelihood: {risk.asIsLikelihood} • Consequence: {risk.asIsConsequence}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Action buttons at bottom */}
          <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
            <Button 
              size="sm"
              className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 px-4"
              onClick={() => {
                onEdit();
                onClose();
              }}
            >
              Edit Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };