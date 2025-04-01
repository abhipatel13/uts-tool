"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"

function GeoFenceSettingsContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [geoFenceLimit, setGeoFenceLimit] = useState<number>(200)
  const [isLoading, setIsLoading] = useState(false)
  const initialLimit = searchParams?.get('limit') ?? '200'

  useEffect(() => {
    // Set initial limit from query parameter
    if (initialLimit) {
      setGeoFenceLimit(Number(initialLimit))
    }

    // Request initial value from parent window
    if (window.opener) {
      window.opener.postMessage({ type: 'requestInitialGeoFenceLimit' }, '*')
    }

    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'initialGeoFenceLimit') {
        setGeoFenceLimit(event.data.limit)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [initialLimit])

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true)

      // Send message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'geoFenceUpdate',
          limit: geoFenceLimit
        }, '*')
      }

      toast({
        title: "Success",
        description: "Geo fence limit updated",
      })

      // Close the window after a short delay
      setTimeout(() => window.close(), 500)
    } catch (error) {
      console.error('Error updating geo fence limit:', error)
      toast({
        title: "Error",
        description: "Failed to update geo fence limit",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#2C3E50] mb-6">Geo Fence Settings</h1>
      
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
            />
            <span className="text-sm text-gray-500">feet</span>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => window.close()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            className="bg-[#00A3FF] hover:bg-[#00A3FF]/90"
            disabled={isLoading}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export default function GeoFenceSettings() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GeoFenceSettingsContent />
    </Suspense>
  )
} 