"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { taskHazardApi } from "@/services/api"
import { BackButton } from "@/components/ui/back-button"

interface TaskHazardWithGeoFence {
  id: string;
  geoFenceLimit?: number;
}

export default function GeoFenceSettings() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [geoFenceLimit, setGeoFenceLimit] = useState<number>(200)
  const [isLoading, setIsLoading] = useState(false)

  // Listen for initial value from parent window
  useEffect(() => {
    const handleInitialValue = (event: MessageEvent) => {
      if (event.data.type === 'initialGeoFenceLimit') {
        setGeoFenceLimit(event.data.limit);
      }
    };

    window.addEventListener('message', handleInitialValue);
    
    // Request initial value from parent window
    if (window.opener) {
      window.opener.postMessage({ type: 'requestInitialGeoFenceLimit' }, '*');
    }

    return () => {
      window.removeEventListener('message', handleInitialValue);
    };
  }, []);

  // Fetch current geo fence limit when component mounts (for existing tasks)
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        if (!params?.id || params.id === 'new') return
        const response = await taskHazardApi.getTaskHazard(params.id)
        console.log("This is the response", response.data);
        const task = response.data as TaskHazardWithGeoFence
        if (task.geoFenceLimit) {
          setGeoFenceLimit(task.geoFenceLimit)
        }
      } catch (error) {
        console.error('Error fetching task details:', error)
        toast({
          title: "Error",
          description: "Failed to load geo fence settings",
          variant: "destructive",
        })
      }
    }

    fetchTaskDetails()
  }, [params?.id, toast])

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true)

      // If this is for an existing task, update it
      if (params?.id && params.id !== 'new') {
        await taskHazardApi.updateTaskHazard(params.id, {
          geoFenceLimit: geoFenceLimit
        } as TaskHazardWithGeoFence)
      }

      // Send message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'geoFenceUpdate',
          limit: geoFenceLimit
        }, '*')
      }

      toast({
        title: "Success",
        description: "Geo fence settings saved successfully",
      })

      // Close the window after a short delay
      setTimeout(() => window.close(), 500)
    } catch (error) {
      console.error('Error saving geo fence settings:', error)
      toast({
        title: "Error",
        description: "Failed to save geo fence settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
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