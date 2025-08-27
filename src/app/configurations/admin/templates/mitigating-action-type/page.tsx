"use client"

import { CommonButton } from "@/components/ui/common-button"


const mitigatingActionTypes = [
  {
    id: "MAT-001",
    name: "Personal Protective Equipment",
    description: "Use of safety equipment and protective gear",
    category: "Safety Equipment",
    status: "Active",
  },
]

export default function MitigatingActionType() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mitigating Action Types</h1>
        <div className="flex gap-4">
          <CommonButton>
            ADD NEW TYPE
          </CommonButton>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">ID</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Description</th>
              <th className="text-left p-4 font-medium">Category</th>
              <th className="text-left p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {mitigatingActionTypes.map((type, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-600">{type.id}</td>
                <td className="p-4 text-gray-600">{type.name}</td>
                <td className="p-4 text-gray-600">{type.description}</td>
                <td className="p-4 text-gray-600">{type.category}</td>
                <td className="p-4 text-gray-600">{type.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 