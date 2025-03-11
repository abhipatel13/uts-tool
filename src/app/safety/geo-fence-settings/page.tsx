"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useRouter } from "next/navigation"
import { geoFenceApi } from "@/services/api"

// Define interface for the geo fence settings
interface GeoFenceSettings {
  limit: number;
}

export default function GeoFenceSettings() {
  const router = useRouter()
  const [geoFenceLimit, setGeoFenceLimit] = useState(200)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Fetch the current geo fence limit when the component mounts
    const fetchGeoFenceLimit = async () => {
      try {
        setIsLoading(true)
        const response = await geoFenceApi.getGeoFenceSettings()
        if (response && response.data) {
          setGeoFenceLimit(response.data.limit)
        }
      } catch (error) {
        console.error("Error fetching geo fence limit:", error)
        // If there's an error, we'll keep the default value
      } finally {
        setIsLoading(false)
      }
    }

    fetchGeoFenceLimit()
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await geoFenceApi.updateGeoFenceSettings({ limit: geoFenceLimit })
      alert("Geo fence limit saved successfully!")
      router.back()
    } catch (error) {
      console.error("Error saving geo fence limit:", error)
      alert("Failed to save geo fence limit. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSliderChange = (value: number[]) => {
    setGeoFenceLimit(value[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 0 && value <= 200) {
      setGeoFenceLimit(value)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Geo Fence Settings</h1>
        
        {isLoading ? (
          <div className="flex justify-center my-8">
            <p>Loading settings...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Label htmlFor="geo-fence-slider" className="block mb-2">
                Geo Fence Limit: {geoFenceLimit} feet
              </Label>
              <Slider
                id="geo-fence-slider"
                max={200}
                step={1}
                value={[geoFenceLimit]}
                onValueChange={handleSliderChange}
                className="mb-4"
              />
              <div className="flex items-center gap-4">
                <Label htmlFor="geo-fence-input" className="whitespace-nowrap">
                  Manual Entry:
                </Label>
                <Input
                  id="geo-fence-input"
                  type="number"
                  min={0}
                  max={200}
                  value={geoFenceLimit}
                  onChange={handleInputChange}
                  className="w-24"
                />
                <span>feet</span>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 