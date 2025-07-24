"use client";

import Link from 'next/link';
import { BarChart3, AlertTriangle } from 'lucide-react';


export default function Safety() {
  const safetyItems = [
    {
      title: "Task Hazard",
      description: "View and manage task hazards",
      icon: "AlertTriangle",
      href: "/safety/task-hazard",
      color: "bg-orange-500"
    },
    {
      title: "Risk Assessment",
      description: "View and manage risk assessments",
      icon: "BarChart3",
      href: "/safety/risk-assessment",
      color: "bg-blue-500"
    }
  ];

  // Get icon component based on icon name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "AlertTriangle":
        return <AlertTriangle className="h-6 w-6" />
      case "BarChart3":
        return <BarChart3 className="h-6 w-6" />
      default:
        return <BarChart3 className="h-6 w-6" />
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Safety Overview</h1>
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safetyItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-full mr-4 group-hover:scale-110 transition-transform ${item.color}`}>
                {getIcon(item.icon)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            </div>
            <p className="text-gray-600 text-sm">{item.description}</p>
            <div className="mt-4 text-sm text-gray-500">
              Click to access →
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 