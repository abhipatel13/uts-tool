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
import { useState } from "react"
import { Label } from "@/components/ui/label"

const taskHazardData = [
  {
    id: "ABC123",
    scopeOfWork: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnaga...",
    dateTime: "18/09/2020 , 10:00AM",
    associatedRisk: "Very Unlikely",
    location: "Long Location Name",
    highestUnmitigated: 10,
    status: "Active",
  },
  {
    id: "ABC123",
    scopeOfWork: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor",
    dateTime: "18/09/2020 , 10:00AM",
    associatedRisk: "Very Unlikely",
    location: "Very Location Name",
    highestUnmitigated: 2,
    status: "Active",
  },
  // Add more sample data as needed
]

export default function TaskHazard() {
  const [open, setOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    id: "",
    date: "",
    time: "",
    scopeOfWork: "",
    assetSystem: "",
    systemLockoutRequired: false,
    trainedWorkforce: "",
    riskTypePersonnel: "",
    asIsLikelihood: "",
    asIsConsequence: "",
    mitigationLikelihood: "",
    mitigationConsequence: "",
    mitigatingActionType: "",
    individual: "",
    supervisor: "",
    status: "Active",
    location: "",
  })

  // Function to set current date and time
  const setCurrentDateTime = () => {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    setNewTask(prev => ({
      ...prev,
      date: currentDate,
      time: currentTime
    }))
  }

  // Update Dialog to set date/time when opened
  const handleDialogChange = (newOpenState: boolean) => {
    setOpen(newOpenState)
    if (newOpenState) {
      setCurrentDateTime()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Add your submit logic here
    console.log(newTask)
    setOpen(false)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Task Hazard Assessment</h1>
        <div className="flex gap-4">
          <Input 
            className="w-[300px]" 
            placeholder="Search field"
          />
          <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 gap-2">
                <Plus className="h-4 w-4" /> ADD NEW
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Task Hazard Assessment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskId">Task Risk ID</Label>
                    <Input
                      id="taskId"
                      value={newTask.id}
                      onChange={(e) => setNewTask({...newTask, id: e.target.value})}
                      placeholder="Enter Task ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTask.date}
                      onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newTask.time}
                      onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="scopeOfWork">Scope of Work</Label>
                    <Input
                      id="scopeOfWork"
                      value={newTask.scopeOfWork}
                      onChange={(e) => setNewTask({...newTask, scopeOfWork: e.target.value})}
                      placeholder="Enter scope of work"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="assetSystem">Asset or System being worked on</Label>
                    <Input
                      id="assetSystem"
                      value={newTask.assetSystem}
                      onChange={(e) => setNewTask({...newTask, assetSystem: e.target.value})}
                      placeholder="Enter asset or system"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemLockout">System Lockout Required</Label>
                    <select
                      id="systemLockout"
                      className="w-full rounded-md border border-input px-3 py-2"
                      value={newTask.systemLockoutRequired.toString()}
                      onChange={(e) => setNewTask({...newTask, systemLockoutRequired: e.target.value === 'true'})}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainedWorkforce">Trained/Competent Workforce</Label>
                    <Input
                      id="trainedWorkforce"
                      value={newTask.trainedWorkforce}
                      onChange={(e) => setNewTask({...newTask, trainedWorkforce: e.target.value})}
                      placeholder="Enter workforce details"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Associated Risks</Label>
                    <select
                      className="w-full rounded-md border border-input px-3 py-2"
                      value={newTask.asIsLikelihood}
                      onChange={(e) => setNewTask({...newTask, asIsLikelihood: e.target.value})}
                    >
                      <option value="">Select Likelihood</option>
                      <option value="Very Unlikely">Very Unlikely</option>
                      <option value="Unlikely">Unlikely</option>
                      <option value="Possible">Possible</option>
                      <option value="Likely">Likely</option>
                      <option value="Very Likely">Very Likely</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Consequence</Label>
                    <select
                      className="w-full rounded-md border border-input px-3 py-2"
                      value={newTask.asIsConsequence}
                      onChange={(e) => setNewTask({...newTask, asIsConsequence: e.target.value})}
                    >
                      <option value="">Select Consequence</option>
                      <option value="Negligible">Negligible</option>
                      <option value="Minor">Minor</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Major">Major</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mitigating Action Type</Label>
                    <select
                      className="w-full rounded-md border border-input px-3 py-2"
                      value={newTask.mitigatingActionType}
                      onChange={(e) => setNewTask({...newTask, mitigatingActionType: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      <option value="Elimination">Elimination</option>
                      <option value="Control">Control</option>
                      <option value="Administrative">Administrative</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="individual">Individual/Team</Label>
                    <Input
                      id="individual"
                      value={newTask.individual}
                      onChange={(e) => setNewTask({...newTask, individual: e.target.value})}
                      placeholder="Enter individual or team"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <Input
                      id="supervisor"
                      value={newTask.supervisor}
                      onChange={(e) => setNewTask({...newTask, supervisor: e.target.value})}
                      placeholder="Enter supervisor name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newTask.location}
                      onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                      placeholder="Enter location"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#00A3FF] hover:bg-[#00A3FF]/90">
                    Add Task
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
              <th className="text-left p-4 text-[#2C3E50] font-medium">Task Risk ID</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Scope of Work</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Date & Time</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Location</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Highest Unmitigated</th>
              <th className="text-left p-4 text-[#2C3E50] font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {taskHazardData.map((task, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-600">{task.id}</td>
                <td className="p-4 text-gray-600 max-w-xs truncate">
                  {task.scopeOfWork}
                </td>
                <td className="p-4 text-gray-600">{task.dateTime}</td>
                <td className="p-4 text-gray-600">{task.location}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      task.highestUnmitigated >= 7 ? 'bg-red-500' : 
                      task.highestUnmitigated >= 4 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`} />
                    <span>{task.highestUnmitigated}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-green-600 bg-green-100">
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 