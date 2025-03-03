"use client"

import { Button } from "@/components/ui/button"

const dataLoaderJobs = [
  {
    jobId: "JOB-001",
    jobDescription: "Asset Import Batch #123",
    dateTime: "2024-02-27 15:30",
    dataLoader: "Asset Hierarchy Import",
    statusLog: "Completed Successfully",
  },
]

export default function DataLoader() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Data Loader</h1>
        <div className="flex gap-4">
          <Button className="bg-[#00A6ED] hover:bg-[#0094d4]">
            IMPORT NEW
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">Job ID</th>
              <th className="text-left p-4 font-medium">Job Description</th>
              <th className="text-left p-4 font-medium">Date & Time</th>
              <th className="text-left p-4 font-medium">Data Loader</th>
              <th className="text-left p-4 font-medium">Status & Log</th>
            </tr>
          </thead>
          <tbody>
            {dataLoaderJobs.map((job, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-600">{job.jobId}</td>
                <td className="p-4 text-gray-600">{job.jobDescription}</td>
                <td className="p-4 text-gray-600">{job.dateTime}</td>
                <td className="p-4 text-gray-600">{job.dataLoader}</td>
                <td className="p-4 text-gray-600">{job.statusLog}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 