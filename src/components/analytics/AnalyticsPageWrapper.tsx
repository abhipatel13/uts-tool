"use client"

import { useState, useEffect, useMemo, useCallback } from "react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import useSupercluster from "use-supercluster";

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

// Clustered Map Component
const ClusteredMap = <T extends { id?: string | number; location?: string }>({ 
  data, 
  mapContainerStyle, 
  center, 
  zoom = 8,
  mapCenter,
  onMarkerClick,
  mapId,
  dataKey
}: {
  data: T[];
  mapContainerStyle: React.CSSProperties;
  center: { lat: number; lng: number };
  zoom?: number;
  mapCenter: { lat: number; lng: number };
  onMarkerClick: (item: T) => void;
  mapId: string;
  dataKey: string;
}) => {
  const map = useMap();
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Center map on filtered data when they change
  useEffect(() => {
    if (map && data.length > 0) {
      // Calculate bounds for all data points
      const lats = data.map(item => {
        if (!item.location || typeof item.location !== 'string') return null;
        const [lat] = item.location.split(',');
        return parseFloat(lat);
      }).filter((lat): lat is number => lat !== null && !isNaN(lat));

      const lngs = data.map(item => {
        if (!item.location || typeof item.location !== 'string') return null;
        const [, lng] = item.location.split(',');
        return parseFloat(lng);
      }).filter((lng): lng is number => lng !== null && !isNaN(lng));

      if (lats.length > 0 && lngs.length > 0) {
        // Calculate bounds for all data points
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        // Calculate center point
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        // Pan to the center of filtered data
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
    } else if (map && data.length === 0) {
      // If no data, center on the provided mapCenter
      map.panTo(mapCenter);
      map.setZoom(zoom);
    }
  }, [map, data, mapCenter, zoom]);

  // Convert data to GeoJSON points
  const points = useMemo(() => {
    return data
      .map((item, index) => {
        if (!item.location || typeof item.location !== 'string') return null;
        
        const [lat, lng] = item.location.split(',');
        if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) return null;
        
        return {
          type: "Feature" as const,
          properties: {
            cluster: false,
            itemId: item.id || index,
            item,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
        };
      })
      .filter(Boolean);
  }, [data]);

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
      mapId={mapId}
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
            key={`${dataKey}-${cluster.properties.itemId}`}
            position={{ lat: latitude, lng: longitude }}
            onClick={() => {
              onMarkerClick(cluster.properties.item);
            }}
          />
        );
      })}
    </Map>
  );
};

interface AnalyticsPageWrapperProps<T extends { id?: string | number; location?: string; status?: string }> {
  title: string;
  searchPlaceholder: string;
  filteredData: T[];
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onMarkerClick: (item: T) => void;
  mapId: string;
  dataKey: string;
  itemCountText: string;
  currentStatusFilter: string;
  children?: React.ReactNode; // For forms and dialogs
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px',
  overflow: 'hidden',
}

const center = {
  lat: 38,
  lng: -99,
}

export function AnalyticsPageWrapper<T extends { id?: string | number; location?: string; status?: string }>({
  title,
  searchPlaceholder,
  filteredData,
  onSearchChange,
  onStatusFilterChange,
  onMarkerClick,
  mapId,
  dataKey,
  itemCountText,
  currentStatusFilter,
  children
}: AnalyticsPageWrapperProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} onLoad={() => console.log('Maps API has loaded.')}>
        {/* Responsive header section */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50]">{title}</h1>
            
            {/* Search and filter controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search bar */}
              <div className="w-full sm:max-w-md">
                <Input 
                  className="w-full" 
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              
              {/* Status filter */}
              <div className="w-full sm:w-48">
                <Select value={currentStatusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Disabled">All Statuses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Render children (forms and dialogs) */}
        {children}

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
              data={filteredData}
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={4}
              mapCenter={center}
              onMarkerClick={onMarkerClick}
              mapId={mapId}
              dataKey={dataKey}
            />
          </div>
          
          {/* Map info footer - responsive */}
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span>{itemCountText}</span>
            <span className="text-gray-500">Click markers for details • Zoom to explore clusters</span>
          </div>
        </div>
      </APIProvider>
    </div>
  )
} 