"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/utils/auth"
import { getDashboardItems, getRoleColorScheme, getRoleTitle } from "@/utils/roleBasedUI"
import { Users, Shield, Database, FileText, Settings } from "lucide-react"
import LicenseProtectedRoute from "@/components/LicenseProtectedRoute"

function DashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<{
    id?: string;
    email: string;
    role: string;
    company?: string | { id?: number; name: string; createdAt?: string; updatedAt?: string; deletedAt?: string | null; };
    permissions?: string[];
    isAuthenticated?: boolean;
  } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render user-specific content until mounted
  if (!mounted || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const dashboardItems = getDashboardItems()
  const { primary } = getRoleColorScheme()
  const roleTitle = getRoleTitle()

  // Get icon component based on icon name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "users":
        return <Users className="h-6 w-6" />
      case "shield":
        return <Shield className="h-6 w-6" />
      case "database":
        return <Database className="h-6 w-6" />
      case "file-text":
        return <FileText className="h-6 w-6" />
      default:
        return <Settings className="h-6 w-6" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          {roleTitle} Dashboard - Access your tools and manage your work
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4`} style={{ backgroundColor: primary }}>
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 mr-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Access Level</p>
              <p className="text-2xl font-bold text-gray-900">Licensed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 mr-4">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Available Features</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 mr-4">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Company</p>
              <p className="text-2xl font-bold text-gray-900">
                {typeof user.company === 'string' 
                  ? user.company 
                  : (user.company && typeof user.company === 'object' && 'name' in user.company)
                    ? user.company.name 
                    : 'Utah Tech'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item, index) => (
          <div
            key={index}
            onClick={() => router.push(item.href)}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-full mr-4 group-hover:scale-110 transition-transform`} style={{ backgroundColor: primary }}>
                {getIcon(item.icon)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            </div>
            <p className="text-gray-600 text-sm">{item.description}</p>
            <div className="mt-4 text-sm text-gray-500">
              Click to access →
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/safety/task-hazard")}
            className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-left"
          >
            <h3 className="font-medium text-orange-900">Create Task Hazard</h3>
            <p className="text-sm text-orange-700 mt-1">Start a new assessment</p>
          </button>
          
          <button
            onClick={() => router.push("/safety/risk-assessment")}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <h3 className="font-medium text-blue-900">Risk Assessment</h3>
            <p className="text-sm text-blue-700 mt-1">Evaluate risks</p>
          </button>
          
          <button
            onClick={() => router.push("/asset-hierarchy")}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <h3 className="font-medium text-green-900">View Assets</h3>
            <p className="text-sm text-green-700 mt-1">Browse hierarchy</p>
          </button>
          
          <button
            onClick={() => router.push("/analytics")}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <h3 className="font-medium text-purple-900">Analytics</h3>
            <p className="text-sm text-purple-700 mt-1">View reports</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <LicenseProtectedRoute>
      <DashboardContent />
    </LicenseProtectedRoute>
  )
}
