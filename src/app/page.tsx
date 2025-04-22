"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/utils/auth"
import { getDashboardItems, getRoleColorScheme, getRoleTitle } from "@/utils/roleBasedUI"
import { Users, Shield, Database, FileText, Settings } from "lucide-react"

export default function Dashboard() {
  const router = useRouter()
  const user = getCurrentUser()
  const dashboardItems = getDashboardItems()
  const { primary } = getRoleColorScheme()
  const roleTitle = getRoleTitle()

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
    }
  }, [user, router])

  if (!user) return null

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user.email} ({roleTitle})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(item.href)}
          >
            <div className={`inline-flex p-3 rounded-lg bg-${primary}-100 text-${primary}-600 mb-4`}>
              {getIcon(item.icon)}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>

      {dashboardItems.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Access</h2>
          <p className="text-gray-600">
            You don&apos;t have access to any dashboard features. Please contact an administrator.
          </p>
        </div>
      )}
    </div>
  )
}
