"use client"

import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
        <h1 className="text-2xl font-bold">Task Hazard</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00A3FF] hover:bg-[#00A3FF]/90">
              + ADD NEW TASK
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
                <div className="space-y-2">
                  <Label htmlFor="dateTime">Date & Time</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={newTask.dateTime}
                    onChange={(e) => setNewTask({...newTask, dateTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scopeOfWork">Scope of Work</Label>
                <Textarea
                  id="scopeOfWork"
                  value={newTask.scopeOfWork}
                  onChange={(e) => setNewTask({...newTask, scopeOfWork: e.target.value})}
                  placeholder="Enter scope of work"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="associatedRisk">Associated Risk</Label>
                  <Select
                    onValueChange={(value) => setNewTask({...newTask, associatedRisk: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Very Unlikely">Very Unlikely</SelectItem>
                      <SelectItem value="Unlikely">Unlikely</SelectItem>
                      <SelectItem value="Possible">Possible</SelectItem>
                      <SelectItem value="Likely">Likely</SelectItem>
                      <SelectItem value="Very Likely">Very Likely</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div className="space-y-2">
                <Label htmlFor="highestUnmitigated">Highest Unmitigated Risk</Label>
                <Input
                  id="highestUnmitigated"
                  type="number"
                  min="1"
                  max="10"
                  value={newTask.highestUnmitigated}
                  onChange={(e) => setNewTask({...newTask, highestUnmitigated: e.target.value})}
                  placeholder="Enter risk score (1-10)"
                />
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

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Task Risk ID</th>
                <th className="text-left p-4">Scope of Work</th>
                <th className="text-left p-4">Date & Time</th>
                <th className="text-left p-4">Associated Risk</th>
                <th className="text-left p-4">Location</th>
                <th className="text-left p-4">Highest Unmitigated</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Action</th>
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
                  <td className="p-4 text-gray-600">{task.associatedRisk}</td>
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
                  <td className="p-4">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              &lt;
            </Button>
            <span>1 of 4</span>
            <Button variant="outline" size="icon">
              &gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 