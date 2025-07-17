"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { riskAssessmentApi } from "@/services/api"
import type { RiskAssessment } from "@/services/api"
import useSupercluster from "use-supercluster";
import RiskAssessmentForm from "@/components/RiskAssessmentForm"

type RiskAssessmentData = RiskAssessment;

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px',
  overflow: 'hidden',
}

// Default center of the map set to Salt Lake City, Utah
const center = {
  lat: 40.760780,
  lng: -111.891045,
}

// Cluster Marker Component
const ClusterMarker = ({ lat, lng, pointCount, onClick }: {
  lat: number;
  lng: number;
  pointCount: number;
  onClick: () => void;
}) => {
  const size = 40 + (pointCount / 10) * 20;
  
  return (
    <AdvancedMarker position={{ lat, lng }}>
      <div
        onClick={onClick}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#00A3FF',
          borderRadius: '50%',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {pointCount}
      </div>
    </AdvancedMarker>
  );
};

// Risk Assessment Info Dialog Component
const RiskAssessmentInfoDialog = ({ 
  assessment, 
  isOpen,
  onClose,
  onEdit
}: {
  assessment: RiskAssessmentData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (assessment: RiskAssessmentData) => void;
}) => {
  if (!assessment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[500px] max-h-[85vh] overflow-y-auto rounded-lg mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg text-gray-800">
            Risk Assessment Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm sm:text-base">
          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">ID:</span>
              <div className="text-gray-900 break-words">{assessment.id || 'N/A'}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">Status:</span>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  assessment.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : assessment.status === 'Pending'
                    ? 'bg-amber-100 text-amber-800'
                    : assessment.status === 'Completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {assessment.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">Date:</span>
              <div className="text-gray-900">{assessment.date || 'N/A'}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">Time:</span>
              <div className="text-gray-900">{assessment.time || 'N/A'}</div>
            </div>
          </div>

          {/* Work Details */}
          <div>
            <span className="font-medium text-gray-600 text-xs sm:text-sm">Scope of Work:</span>
            <div className="text-gray-900 break-words mt-1">{assessment.scopeOfWork || 'N/A'}</div>
          </div>
          
          <div>
            <span className="font-medium text-gray-600 text-xs sm:text-sm">Asset System:</span>
            <div className="text-gray-900 break-words mt-1">{assessment.assetSystem || 'N/A'}</div>
          </div>

          {/* Location */}
          <div>
            <span className="font-medium text-gray-600 text-xs sm:text-sm">Location:</span>
            <div className="text-gray-900 break-words mt-1">{assessment.location || 'N/A'}</div>
          </div>

          {/* Personnel */}
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">Individuals:</span>
              <div className="text-gray-900 break-words mt-1">{assessment.individuals || 'N/A'}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">Supervisor:</span>
              <div className="text-gray-900 break-words mt-1">{assessment.supervisor || 'N/A'}</div>
            </div>
          </div>

          {/* System Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">System Lockout Required:</span>
              <div className={`text-sm mt-1 ${assessment.systemLockoutRequired ? 'text-red-600' : 'text-green-600'}`}>
                {assessment.systemLockoutRequired ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">Trained Workforce:</span>
              <div className={`text-sm mt-1 ${assessment.trainedWorkforce ? 'text-green-600' : 'text-red-600'}`}>
                {assessment.trainedWorkforce ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          {/* Risks Section */}
          {assessment.risks && assessment.risks.length > 0 && (
            <div>
              <span className="font-medium text-gray-600 text-xs sm:text-sm">Associated Risks:</span>
              <div className="mt-2 space-y-2">
                {assessment.risks.map((risk, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-xs sm:text-sm text-red-800 font-medium">
                      {risk.riskType || 'Unknown Risk Type'}
                    </div>
                    <div className="text-xs sm:text-sm text-red-700 mt-1 break-words">
                      {risk.riskDescription || 'No description available'}
                    </div>
                    {risk.mitigatingAction && (
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <span className="text-xs text-red-600 font-medium">Mitigation:</span>
                        <div className="text-xs text-red-700 mt-1">{risk.mitigatingAction}</div>
                      </div>
                    )}
                  </div>
                ))}
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
              onEdit(assessment);
              onClose();
            }}
          >
            Edit Assessment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Clustered Map Component
const ClusteredMap = ({ 
  assessments, 
  mapContainerStyle, 
  center, 
  zoom = 8,
  mapCenter,
  onMarkerClick
}: {
  assessments: RiskAssessmentData[];
  mapContainerStyle: React.CSSProperties;
  center: { lat: number; lng: number };
  zoom?: number;
  mapCenter: { lat: number; lng: number };
  onMarkerClick: (assessment: RiskAssessmentData) => void;
}) => {
  const map = useMap();
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Center map on filtered assessments when they change
  useEffect(() => {
    if (map && assessments.length > 0) {
      // Calculate bounds for all assessments
      const lats = assessments.map(assessment => {
        if (!assessment.location || typeof assessment.location !== 'string') return null;
        const [lat] = assessment.location.split(',');
        return parseFloat(lat);
      }).filter((lat): lat is number => lat !== null && !isNaN(lat));

      const lngs = assessments.map(assessment => {
        if (!assessment.location || typeof assessment.location !== 'string') return null;
        const [, lng] = assessment.location.split(',');
        return parseFloat(lng);
      }).filter((lng): lng is number => lng !== null && !isNaN(lng));

      if (lats.length > 0 && lngs.length > 0) {
        // Calculate bounds for all assessments
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        // Calculate center point
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        // Pan to the center of filtered assessments
        map.panTo({ lat: centerLat, lng: centerLng });

        // Calculate appropriate zoom level based on the spread of points
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;
        const maxDiff = Math.max(latDiff, lngDiff);

        // Use more appropriate zoom calculation with better thresholds
        let newZoom = 8; // Default zoom level
        if (maxDiff < 0.01) {
          // Very close points (within ~1km)
          newZoom = 15;
        } else if (maxDiff < 0.1) {
          // Close points (within ~10km)
          newZoom = 12;
        } else if (maxDiff < 0.5) {
          // Medium distance (within ~50km)
          newZoom = 10;
        } else if (maxDiff < 2) {
          // Larger area (within ~200km)
          newZoom = 8;
        } else if (maxDiff < 10) {
          // Large area (within ~1000km)
          newZoom = 6;
        } else {
          // Very large area
          newZoom = 4;
        }
        // Ensure zoom is within reasonable bounds
        newZoom = Math.max(3, Math.min(15, newZoom));
        map.setZoom(newZoom);
      }
    } else if (map && assessments.length === 0) {
      // If no assessments, center on the provided mapCenter
      map.panTo(mapCenter);
      map.setZoom(zoom);
    }
  }, [map, assessments, mapCenter, zoom]);

  // Convert assessments to GeoJSON points
  const points = useMemo(() => {
    return assessments
      .map((assessment, index) => {
        if (!assessment.location || typeof assessment.location !== 'string') return null;
        
        const [lat, lng] = assessment.location.split(',');
        if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) return null;
        
        return {
          type: "Feature" as const,
          properties: {
            cluster: false,
            assessmentId: assessment.id || index,
            assessment,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
        };
      })
      .filter(Boolean);
  }, [assessments]);

  // Get clusters using useSupercluster
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: mapZoom,
    options: { radius: 75, maxZoom: 15 },
  });

  // Handle map bounds change
  const handleBoundsChanged = useCallback(() => {
    if (!map) return;
    
    const mapBounds = map.getBounds();
    if (mapBounds) {
      const ne = mapBounds.getNorthEast();
      const sw = mapBounds.getSouthWest();
      setBounds([
        sw.lng(),
        sw.lat(), 
        ne.lng(),
        ne.lat(),
      ]);
    }
  }, [map]);

  // Handle zoom change
  const handleZoomChanged = useCallback(() => {
    if (!map) return;
    setMapZoom(map.getZoom() || zoom);
  }, [map, zoom]);

  useEffect(() => {
    if (!map) return;
    handleBoundsChanged();
    handleZoomChanged();
  }, [map, handleBoundsChanged, handleZoomChanged]);

  return (
    <Map
      style={mapContainerStyle}
      defaultZoom={zoom}
      defaultCenter={center}
      mapId="risk-assessment-analytics-map"
      onBoundsChanged={handleBoundsChanged}
      onZoomChanged={handleZoomChanged}
    >
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const {
          cluster: isCluster,
          point_count: pointCount,
        } = cluster.properties;

        if (isCluster) {
          return (
            <ClusterMarker
              key={`cluster-${cluster.id}`}
              lat={latitude}
              lng={longitude}
              pointCount={pointCount}
              onClick={() => {
                if (!map || !supercluster) return;
                const expansionZoom = Math.min(
                  supercluster.getClusterExpansionZoom(cluster.id as number),
                  15
                );
                map.setZoom(expansionZoom);
                map.panTo({ lat: latitude, lng: longitude });
              }}
            />
          );
        }

        return (
          <AdvancedMarker
            key={`assessment-${cluster.properties.assessmentId}`}
            position={{ lat: latitude, lng: longitude }}
            onClick={() => {
              onMarkerClick(cluster.properties.assessment);
            }}
          />
        );
      })}
    </Map>
  );
};

export default function RiskAssessmentAnalytics() {
  const [open, setOpen] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessmentData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [riskAssessments, setRiskAssessments] = useState<RiskAssessmentData[]>([]);
  const [filterAssessments, setFilterAssessments] = useState<RiskAssessmentData[]>([]);
  const [filterAssessmentsBy, setFilterAssessmentsBy] = useState<string>("Active");
  
  // Dialog state for assessment details
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessmentData | null>(null);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);

  // Consolidated fetchRiskAssessments function
  const fetchRiskAssessments = async () => {
    const response = await riskAssessmentApi.getRiskAssessments()
    if (response && response.status && Array.isArray(response.data)) {
      setRiskAssessments(response.data)
    } else {
      // Fallback if the response structure is unexpected
      setRiskAssessments([])
    }
  }

  useEffect(() => {
    setFilterAssessmentsBy("Active");
    fetchRiskAssessments()
  }, [])

  useEffect(() => {
    let filteredAssessments = riskAssessments
    if (filterAssessmentsBy !== "Disabled") {
      filteredAssessments = filteredAssessments.filter((assessment) => assessment.status === filterAssessmentsBy)
    }
      // Apply search filter if search query exists
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        filteredAssessments = riskAssessments.filter((assessment) => {
          return (
            (assessment.id && assessment.id.toString().includes(query)) ||
            (assessment.scopeOfWork && assessment.scopeOfWork.toLowerCase().includes(query)) ||
            (assessment.assetSystem && assessment.assetSystem.toLowerCase().includes(query)) ||
            (assessment.individuals && assessment.individuals.toLowerCase().includes(query)) ||
            (assessment.supervisor && assessment.supervisor.toLowerCase().includes(query)) ||
            (assessment.location && assessment.location.toLowerCase().includes(query)) ||
            (assessment.status && assessment.status.toLowerCase().includes(query)) ||
            (assessment.risks && assessment.risks.some(risk => 
              (risk.riskDescription && risk.riskDescription.toLowerCase().includes(query)) ||
              (risk.riskType && risk.riskType.toLowerCase().includes(query))
            ))
          )
        })  
      }
      
      setFilterAssessments(filteredAssessments)
    
  }, [riskAssessments, filterAssessmentsBy, searchQuery])

  const handleEdit = (assessment: RiskAssessmentData) => {
    setEditingAssessment(assessment)
    setOpen(true)
  }

  const handleFormSuccess = () => {
    // Refresh the risk assessments data after successful edit
    fetchRiskAssessments()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <BackButton text="Back" />
      </div>
      
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} onLoad={() => console.log('Maps API has loaded.')}>
        {/* Responsive header section */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50]">Risk Assessment Analytics</h1>
            
            {/* Search bar */}
            <div className="w-full sm:max-w-md">
              <Input 
                className="w-full" 
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <RiskAssessmentForm
          open={open}
          onOpenChange={setOpen}
          mode="edit"
          assessment={editingAssessment}
          onSuccess={handleFormSuccess}
        />

        <RiskAssessmentInfoDialog
          assessment={selectedAssessment}
          isOpen={isAssessmentDialogOpen}
          onClose={() => {
            setIsAssessmentDialogOpen(false);
            setSelectedAssessment(null);
          }}
          onEdit={handleEdit}
        />

        {/* Responsive map container */}
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 flex flex-col">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#2C3E50]">Location Map</h2>
          <div 
            className="rounded-lg overflow-hidden border bg-gray-100"
            style={{ 
              height: 'calc(100vh - 280px)',
              minHeight: '400px'
            }}
          >
            <ClusteredMap
              assessments={filterAssessments}
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={8}
              mapCenter={center}
              onMarkerClick={(assessment) => {
                setSelectedAssessment(assessment);
                setIsAssessmentDialogOpen(true);
              }}
            />
          </div>
          
          {/* Map info footer - responsive */}
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span>Showing {filterAssessments.length} risk assessment{filterAssessments.length !== 1 ? 's' : ''}</span>
            <span className="text-gray-500">Click markers for details • Zoom to explore clusters</span>
          </div>
        </div>
      </APIProvider>
    </div>
  )
} 