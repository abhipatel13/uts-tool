"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"

interface GeoFenceSettingsProps {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  initialLimit?: number
  onSave?: (limit: number) => Promise<void> | void
}

export function GeoFenceSettings({ 
  open,
  onOpenChange,
  initialLimit = 200,
  onSave
}: GeoFenceSettingsProps) {
  const { toast } = useToast()
  const [geoFenceLimit, setGeoFenceLimit] = useState<number>(initialLimit)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setGeoFenceLimit(initialLimit)
  }, [initialLimit])

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true)

      if (onSave) {
        await onSave(geoFenceLimit)
      }

      toast({
        title: "Success",
        description: "Geo fence limit updated",
      })
    } catch (error) {
      console.error('Error updating geo fence limit:', error)
      toast({
        title: "Error",
        description: "Failed to update geo fence limit",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setGeoFenceLimit(initialLimit)
    onOpenChange(false)
  }

  return (
    open ? (
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Geo Fence Limit: {geoFenceLimit} feet
            </label>
            <Slider
              value={[geoFenceLimit]}
              onValueChange={(value) => setGeoFenceLimit(value[0])}
              max={1000}
              step={10}
              className="mb-4"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Manual Entry:</label>
            <Input
              type="number"
              value={geoFenceLimit}
              onChange={(e) => setGeoFenceLimit(Number(e.target.value))}
              className="w-24"
              min={0}
              max={1000}
            />
            <span className="text-sm text-gray-500">feet</span>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveSettings}
            className="bg-[#00A3FF] hover:bg-[#00A3FF]/90"
            disabled={isLoading}
          >
            Save Settings
          </Button>
        </div>
      </div>
    ) : null
    
  )
} 