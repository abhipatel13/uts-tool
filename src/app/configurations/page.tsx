'use client';
import { CommonButton } from "@/components/ui/common-button"
import Link from "next/link"
import { 
  Users, 
  Settings, 
  FileText, 
  Shield, 
  Database, 
  Palette,
  Bell,
  MapPin
} from "lucide-react"

export default function Configurations() {
  const configurationItems = [
    {
      title: "Admin",
      description: "Manage users, licensing, and system administration",
      icon: "Users",
      href: "/configurations/admin",
      color: "bg-purple-500"
    },
    {
      title: "Templates", 
      description: "Configure risk matrices and action types",
      icon: "FileText",
      href: "/configurations/template",
      color: "bg-blue-500"
    },
    {
      title: "Profile",
      description: "Manage your user profile and preferences",
      icon: "User",
      href: "/configurations/profile",
      color: "bg-green-500"
    }
  ];

  // Get icon component based on icon name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Users":
        return <Users className="h-6 w-6" />
      case "FileText":
        return <FileText className="h-6 w-6" />
      case "User":
        return <Shield className="h-6 w-6" />
      default:
        return <Settings className="h-6 w-6" />
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Configurations</h1>
      
      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configurationItems.map((item, index) => (
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