"use client"

import { Input } from "@/components/ui/input"
import { BackButton } from "@/components/ui/back-button"

const taskHazardData = [
  {
    taskRiskId: "THA-001",
    scopeOfWork: "Equipment Maintenance",
    dateTime: "2024-03-20 09:00",
    location: "Factory Floor A",
    highestUnmitigated: 7,
    status: "In Progress"
  },
]

export default function TaskHazardAnalytics() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Risk Assessment Dashboard</h1>
        <div className="flex gap-4">
          <Input 
            className="w-[300px]" 
            placeholder="Search field"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">Task Risk ID</th>
              <th className="text-left p-4 font-medium">Scope of Work</th>
              <th className="text-left p-4 font-medium">Date & Time</th>
              <th className="text-left p-4 font-medium">Location</th>
              <th className="text-left p-4 font-medium">Highest Unmitigated</th>
              <th className="text-left p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {taskHazardData.map((task, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-600">{task.taskRiskId}</td>
                <td className="p-4 text-gray-600">{task.scopeOfWork}</td>
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
                <td className="p-4 text-gray-600">{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 