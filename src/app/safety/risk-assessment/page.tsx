"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const riskAssessmentData = [
  {
    taskRiskId: "TR123",
    location: "Main Factory Floor",
    scopeOfWork: "Equipment Maintenance",
    asset: "Conveyor Belt System",
    createdBy: "John Smith",
    createdOn: "18/09/2020"
  },
]

export default function RiskAssessment() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    riskAssessmentId: "",
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
    location: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Risk Assessment Dashboard</h1>
        <div className="flex gap-4">
          <Input 
            className="w-[300px]" 
            placeholder="Search field"
          />
          <Dialog open={open} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 gap-2">
                <Plus className="h-4 w-4" /> ADD NEW
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Risk Assessment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="riskAssessmentId">Risk Assessment ID</Label>
                    <Input
                      id="riskAssessmentId"
                      value={formData.riskAssessmentId}
                      onChange={(e) => handleInputChange("riskAssessmentId", e.target.value)}
                      placeholder="Enter Risk Assessment ID"
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scopeOfWork">Scope of Work</Label>
                  <Textarea
                    id="scopeOfWork"
                    value={formData.scopeOfWork}
                    onChange={(e) => handleInputChange("scopeOfWork", e.target.value)}
                    placeholder="Enter scope of work"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetSystem">Asset or System being worked on</Label>
                  <Input
                    id="assetSystem"
                    value={formData.assetSystem}
                    onChange={(e) => handleInputChange("assetSystem", e.target.value)}
                    placeholder="Enter asset or system"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemLockout">System Lockout Required</Label>
                    <Select
                      value={formData.systemLockout}
                      onValueChange={(value) => handleInputChange("systemLockout", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainedWorkforce">Trained/Competent Workforce</Label>
                    <Select
                      value={formData.trainedWorkforce}
                      onValueChange={(value) => handleInputChange("trainedWorkforce", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="associatedRisks">Associated Risks</Label>
                  <Textarea
                    id="associatedRisks"
                    value={formData.associatedRisks}
                    onChange={(e) => handleInputChange("associatedRisks", e.target.value)}
                    placeholder="Enter associated risks"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consequence">Consequence</Label>
                  <Textarea
                    id="consequence"
                    value={formData.consequence}
                    onChange={(e) => handleInputChange("consequence", e.target.value)}
                    placeholder="Enter consequence"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mitigatingActionType">Mitigating Action Type</Label>
                  <Input
                    id="mitigatingActionType"
                    value={formData.mitigatingActionType}
                    onChange={(e) => handleInputChange("mitigatingActionType", e.target.value)}
                    placeholder="Enter mitigating action type"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="individualTeam">Individual/Team</Label>
                    <Input
                      id="individualTeam"
                      value={formData.individualTeam}
                      onChange={(e) => handleInputChange("individualTeam", e.target.value)}
                      placeholder="Enter individual or team name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <Input
                      id="supervisor"
                      value={formData.supervisor}
                      onChange={(e) => handleInputChange("supervisor", e.target.value)}
                      placeholder="Enter supervisor name"
                    />
                  </div>
                </div>

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

      <div className="bg-white rounded-lg shadow-sm border overflow-auto h-[calc(100vh-180px)]">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">Task Risk ID</th>
              <th className="text-left p-4 font-medium">Location</th>
              <th className="text-left p-4 font-medium">Scope of Work</th>
              <th className="text-left p-4 font-medium">Asset/System</th>
              <th className="text-left p-4 font-medium">Created By</th>
              <th className="text-left p-4 font-medium">Created On</th>
            </tr>
          </thead>
          <tbody>
            {riskAssessmentData.map((risk, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-600">{risk.taskRiskId}</td>
                <td className="p-4 text-gray-600">{risk.location}</td>
                <td className="p-4 text-gray-600 max-w-xs truncate">{risk.scopeOfWork}</td>
                <td className="p-4 text-gray-600">{risk.asset}</td>
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