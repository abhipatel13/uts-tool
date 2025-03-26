"use client"

import { Input } from "@/components/ui/input"

const userData = [
  {
    user: "John Smith",
    email: "john.smith@example.com",
    phoneNumber: "+1 234 567 8900",
  },
  // Add more sample data as needed
]

export default function UsersAdmin() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
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
              <th className="text-left p-4 font-medium">User</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Phone Number</th>
              <th className="text-left p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {userData.map((user, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 text-gray-600">{user.user}</td>
                <td className="p-4 text-gray-600">{user.email}</td>
                <td className="p-4 text-gray-600">{user.phoneNumber}</td>
                <td className="p-4">
                  <button className="text-blue-500 hover:text-blue-700">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 