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
    scopeOfWork: "",
    dateTime: "",
    associatedRisk: "",
    location: "",
    highestUnmitigated: "",
    status: "Active"
  })

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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90 gap-2">
                <Plus className="h-4 w-4" /> ADD NEW
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
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
                  {/* Add other form fields similarly */}
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