"use client"

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import { calculateOptimalMapBounds, extractCoordinatesFromData } from '@/lib/map-utils'

// Fix Leaflet default marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Base interface for data items that can be displayed on the map
interface MapDataItem {
  id?: string | number;
  location?: string;
  [key: string]: unknown;
}

interface ClusteredMapProps {
  data: MapDataItem[];
  center: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick: (item: MapDataItem) => void;
  dataKey: string;
}

export function ClusteredMap({ 
  data, 
  center, 
  zoom = 4,
  onMarkerClick,
  dataKey
}: ClusteredMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersClusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const dataRef = useRef<MapDataItem[]>(data)
  const onMarkerClickRef = useRef(onMarkerClick)
  
  // Keep refs updated
  useEffect(() => {
    dataRef.current = data
  }, [data])
  
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick
  }, [onMarkerClick])

  // Function to update markers
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !markersClusterRef.current) return
    
    const currentData = dataRef.current
    const currentOnMarkerClick = onMarkerClickRef.current
    
    // Clear existing markers
    markersClusterRef.current.clearLayers()
    
    // Add new markers
    currentData.forEach((item) => {
      if (!item.location || typeof item.location !== 'string') return
      
      const parts = item.location.split(',')
      if (parts.length !== 2) return
      
      const lat = parseFloat(parts[0].trim())
      const lng = parseFloat(parts[1].trim())
      
      if (isNaN(lat) || isNaN(lng)) return
      
      const marker = L.marker([lat, lng])
      marker.on('click', () => {
        currentOnMarkerClick(item)
      })
      
      markersClusterRef.current?.addLayer(marker)
    })
    
    // Fit map to markers
    if (currentData.length > 0) {
      const coordinates = extractCoordinatesFromData(currentData)
      
      if (coordinates.length > 0) {
        const optimalBounds = calculateOptimalMapBounds(coordinates, {
          padding: 0.15,
          maxZoom: 15,
          minZoom: 2,
          defaultZoom: 8
        })
        
        mapRef.current.setView([optimalBounds.center.lat, optimalBounds.center.lng], optimalBounds.zoom)
      }
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], zoom)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)

    // Create marker cluster group with custom styling
    const markersCluster = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        let size = 40
        let className = 'marker-cluster-small'
        
        if (count >= 100) {
          size = 60
          className = 'marker-cluster-large'
        } else if (count >= 10) {
          size = 50
          className = 'marker-cluster-medium'
        }
        
        return L.divIcon({
          html: `<div style="
            width: ${size}px;
            height: ${size}px;
            background-color: #00A3FF;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: className,
          iconSize: L.point(size, size)
        })
      }
    })
    
    map.addLayer(markersCluster)
    
    mapRef.current = map
    markersClusterRef.current = markersCluster

    // Initial marker update
    updateMarkers()

    return () => {
      map.remove()
      mapRef.current = null
      markersClusterRef.current = null
    }
  // We only want this to run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when data changes
  useEffect(() => {
    updateMarkers()
  }, [data, dataKey, updateMarkers])

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width: '100%', height: '100%' }}
      className="rounded-lg"
    />
  )
}

