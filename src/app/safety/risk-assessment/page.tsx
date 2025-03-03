"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

const riskAssessmentData = [
  {
    raId: "RA123",
    functionalLocation: "Main Factory Floor",
    riskScore: 8,
    risk: "Equipment failure during operation",
    createdBy: "John Smith",
    createdOn: "18/09/2020",
  },
]

export default function RiskAssessment() {
  const [open, setOpen] = useState(false)
  const [newRisk, setNewRisk] = useState({
    raId: "",
    functionalLocation: "",
    riskScore: "",
    risk: "",
    createdBy: "",
    createdOn: "",
    dateTime: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(newRisk)
    setOpen(false)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Risk Assessment Dashboard</h1>
        <div className="flex gap-4">
          <Input 
            className="w-[300px]" 
            placeholder="Search field"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 gap-2">
                <Plus className="h-4 w-4" /> ADD NEW
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Risk Assessment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="raId">RA ID</Label>
                    <Input
                      id="raId"
                      value={newRisk.raId}
                      onChange={(e) => setNewRisk({...newRisk, raId: e.target.value})}
                      placeholder="Enter RA ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTime">Date & Time</Label>
                    <Input
                      id="dateTime"
                      type="datetime-local"
                      value={newRisk.dateTime}
                      onChange={(e) => setNewRisk({...newRisk, dateTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk">Risk</Label>
                  <Input
                    id="risk"
                    value={newRisk.risk}
                    onChange={(e) => setNewRisk({...newRisk, risk: e.target.value})}
                    placeholder="Enter risk description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newRisk.functionalLocation}
                    onChange={(e) => setNewRisk({...newRisk, functionalLocation: e.target.value})}
                    placeholder="Enter location"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#00A3FF] hover:bg-[#00A3FF]/90">
                    Add Risk
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">RA ID</th>
              <th className="text-left p-4 font-medium">Functional Location</th>
              <th className="text-left p-4 font-medium">Risk Score</th>
              <th className="text-left p-4 font-medium">Risk</th>
              <th className="text-left p-4 font-medium">Created By</th>
              <th className="text-left p-4 font-medium">Created On</th>
            </tr>
          </thead>
          <tbody>
            {riskAssessmentData.map((risk, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-600">{risk.raId}</td>
                <td className="p-4 text-gray-600">{risk.functionalLocation}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      risk.riskScore >= 7 ? 'bg-red-500' : 
                      risk.riskScore >= 4 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`} />
                    <span>{risk.riskScore}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-600 max-w-xs truncate">{risk.risk}</td>
                <td className="p-4 text-gray-600">{risk.createdBy}</td>
                <td className="p-4 text-gray-600">{risk.createdOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}