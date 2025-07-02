"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {  MapPin } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'

const riskAssessmentData = [
  {
    taskRiskId: "TR123",
    location: "Main Factory Floor",
    scopeOfWork: "Equipment Maintenance",
    asset: "Conveyor Belt System",
    createdBy: "John Smith",
    createdOn: "18/09/2020",
    coordinates: { lat: -34.397, lng: 150.644 },
  },
]

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 120px)',
  borderRadius: '8px',
}

const center = {
  lat: -34.397,
  lng: 150.644,
}

export default function RiskAssessment() {
  const [open, setOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(center)
  const [formData, setFormData] = useState({
    taskHazardId: "",
    date: "",
    time: "",
    scopeOfWork: "",
    assetSystem: "",
    systemLockout: "",
    trainedWorkforce: "",
    associatedRisks: "",
    consequence: "",
    mitigatingActionType: "",
    individualTeam: "",
    supervisor: "",
    location: "",
    coordinates: center
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      }
      setSelectedLocation(newLocation)
      setFormData(prev => ({
        ...prev,
        coordinates: newLocation
      }))
    }
  }

  const handleDialogOpen = (open: boolean) => {
    if (open) {
      const now = new Date()
      const currentDate = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().split(':').slice(0, 2).join(':')
      
      setFormData(prev => ({
        ...prev,
        date: currentDate,
        time: currentTime
      }))
    }
    setOpen(open)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(formData)
    setOpen(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Hazard Analytics</h1>
        <div className="flex gap-4">
          <Input 
            className="w-[300px]" 
            placeholder="Search field"
          />
          <Dialog open={open} onOpenChange={handleDialogOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Task Hazard</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskHazardId">Task Hazard ID</Label>
                    <Input
                      id="taskHazardId"
                      value={formData.taskHazardId}
                      onChange={(e) => handleInputChange("taskHazardId", e.target.value)}
                      placeholder="Enter Task Hazard ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Enter location"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Location on Map</Label>
                  <div className="border rounded-lg p-2">
                    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={8}
                        center={center}
                        onClick={handleMapClick}
                      >
                        <Marker
                          position={selectedLocation}
                          icon={{
                            path: MapPin.toString(),
                            fillColor: "#00A3FF",
                            fillOpacity: 1,
                            strokeWeight: 1,
                            strokeColor: "#ffffff",
                            scale: 1.5,
                          }}
                        />
                      </GoogleMap>
                    </LoadScript>
                  </div>
                </div>

                {/* Rest of the form fields */}
                {/* ... existing form fields ... */}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#00A3FF] hover:bg-[#00A3FF]/90">
                    Create Assessment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 h-[calc(100vh-120px)]">
          <h2 className="text-lg font-semibold mb-4">Location Map</h2>
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={8}
              center={center}
            >
              {riskAssessmentData.map((risk, index) => (
                <Marker
                  key={index}
                  position={risk.coordinates}
                  icon={{
                    path: MapPin.toString(),
                    fillColor: "#00A3FF",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#ffffff",
                    scale: 1.5,
                  }}
                />
              ))}
            </GoogleMap>
          </LoadScript>

      
      </div>
    </div>
  )
}