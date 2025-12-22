"use client"

import { useEffect, useRef } from 'react'
import L from 'leaflet'

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

interface LocationMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markerPosition: { lat: number; lng: number };
  onMapClick: (lat: number, lng: number) => void;
  height?: string;
}

export function LocationMap({ 
  center, 
  zoom, 
  markerPosition, 
  onMapClick,
  height = '250px' 
}: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], zoom)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)

    // Add click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    })

    // Add marker
    const marker = L.marker([markerPosition.lat, markerPosition.lng]).addTo(map)
    markerRef.current = marker

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  // We only want this to run once on mount, so we disable the exhaustive deps check
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update marker position when it changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([markerPosition.lat, markerPosition.lng])
    }
    if (mapRef.current) {
      mapRef.current.setView([markerPosition.lat, markerPosition.lng], mapRef.current.getZoom())
    }
  }, [markerPosition.lat, markerPosition.lng])

  // Update zoom when it changes from outside
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setZoom(zoom)
    }
  }, [zoom])

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width: '100%', height }}
      className="rounded-lg"
    />
  )
}

