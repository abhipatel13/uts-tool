"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useRouter } from "next/navigation"

export default function GeoFenceSettings() {
  const router = useRouter()
  const [geoFenceLimit, setGeoFenceLimit] = useState(200)

  const handleSave = () => {
    router.back()
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Geo Fence Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="geoFenceLimit" className="text-lg font-medium">
              Geo Fence Limit: {geoFenceLimit} Feet
            </Label>
            <div className="mt-6">
              <Slider
                id="geoFenceLimit"
                defaultValue={[geoFenceLimit]}
                max={200}
                step={1}
                onValueChange={(value) => setGeoFenceLimit(value[0])}
                className="py-4"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>0 Feet</span>
                <span>100 Feet</span>
                <span>200 Feet</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Label className="text-lg font-medium">Manual Entry</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                value={geoFenceLimit}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (!isNaN(value) && value >= 0 && value <= 200) {
                    setGeoFenceLimit(value)
                  }
                }}
                min={0}
                max={200}
                className="w-24"
              />
              <span>Feet</span>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90" onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 