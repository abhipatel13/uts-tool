"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import type { MapMouseEvent } from '@vis.gl/react-google-maps'

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showMapByDefault?: boolean;
  className?: string;
}

export function LocationSelector({
  value,
  onChange,
  error,
  label = "Location",
  placeholder = "Enter location or click on map",
  required = false,
  showMapByDefault = false,
  className
}: LocationSelectorProps) {
  const { toast } = useToast() as { toast: (params: { title: string; description: string; variant?: "default" | "destructive" }) => void }
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [showMap, setShowMap] = useState(showMapByDefault)
  const [selectedMapLocation, setSelectedMapLocation] = useState({ lat: 40.760780, lng: -111.891045 }) // Default to Salt Lake City, Utah

  const getLocation = () => {
    setIsLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
            onChange(coords);
            
            // Update map location
            setSelectedMapLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });

          } catch (error) {
            console.error("Error getting location name:", error);
            toast({
              title: "Warning",
              description: "Could not get address. Using coordinates instead.",
              variant: "default",
            });
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Failed to get location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Please enable location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "Please enter manually.";
          }
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported in your browser.",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
    }
  };

  // Handle map click to set location
  const handleMapClick = (event: MapMouseEvent) => {
    if (event.detail?.latLng) {
      const newLocation = {
        lat: event.detail.latLng.lat,
        lng: event.detail.latLng.lng,
      }
      setSelectedMapLocation(newLocation)
      // Update the location field with coordinates
      const coords = `${newLocation.lat}, ${newLocation.lng}`
      onChange(coords)
    }
  }

  // Update map location when location value changes (for manual entry or GPS)
  useEffect(() => {
    if (value && typeof value === 'string') {
      const [lat, lng] = value.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedMapLocation({ lat, lng });
      }
    }
  }, [value]);

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label htmlFor="location" className="text-sm font-medium">
        {label} {required && "*"}
      </Label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          id="location"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 h-11 ${error ? "border-red-500" : ""}`}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={getLocation}
            disabled={isLoadingLocation}
            className="h-11 px-4 flex-1 sm:flex-none"
          >
            {isLoadingLocation ? "..." : "📍 GPS"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            className="h-11 px-4 flex-1 sm:flex-none"
          >
            🗺️ Map
          </Button>
        </div>
      </div>
      {showMap && (
        <div className="space-y-2 mt-4">
          <Label className="text-sm font-medium">Select Location on Map</Label>
          <div className="border rounded-lg p-2 overflow-hidden">
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
              <Map
                style={{ width: '100%', height: '250px' }}
                defaultZoom={8}
                defaultCenter={selectedMapLocation}
                onClick={handleMapClick}
                mapId="location-selector-map"
              >
                <AdvancedMarker
                  position={selectedMapLocation}
                />
              </Map>
            </APIProvider>
          </div>
        </div>
      )}
      {error && (
        <span className="text-red-500 text-xs">{error}</span>
      )}
    </div>
  )
} 