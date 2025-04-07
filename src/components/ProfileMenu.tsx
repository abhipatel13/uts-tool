"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings, Shield, Users, FileText, Database } from "lucide-react"
import { getCurrentUser, hasPermission, logout } from "@/utils/auth"

export function ProfileMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const user = getCurrentUser()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
  }

  // Get role-specific icon
  const getRoleIcon = () => {
    switch (user.role) {
      case "superuser":
        return <Shield className="h-5 w-5 text-purple-500" />
      case "admin":
        return <Users className="h-5 w-5 text-blue-500" />
      case "supervisor":
        return <FileText className="h-5 w-5 text-green-500" />
      default:
        return <User className="h-5 w-5 text-gray-500" />
    }
  }

  // Get role-specific color
  const getRoleColor = () => {
    switch (user.role) {
      case "superuser":
        return "bg-purple-100 text-purple-800"
      case "admin":
        return "bg-blue-100 text-blue-800"
      case "supervisor":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`p-2 rounded-full ${getRoleColor()}`}>
          {getRoleIcon()}
        </div>
        <span className="font-medium">{user.email}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 border">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            {user.company && (
              <p className="text-xs text-gray-500">{user.company}</p>
            )}
          </div>

          <div className="py-1">
            {/* Profile Link - Available to all users */}
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                setIsOpen(false)
                router.push("/profile")
              }}
            >
              <User className="h-4 w-4" />
              Profile
            </button>

            {/* Admin Features */}
            {hasPermission("account_creation") && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  setIsOpen(false)
                  router.push("/admin/users")
                }}
              >
                <Users className="h-4 w-4" />
                Manage Users
              </button>
            )}

            {/* Licensing Management */}
            {hasPermission("licensing_management") && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  setIsOpen(false)
                  router.push("/admin/licenses")
                }}
              >
                <Shield className="h-4 w-4" />
                Manage Licenses
              </button>
            )}

            {/* Asset Hierarchy */}
            {hasPermission("asset_hierarchy") && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  setIsOpen(false)
                  router.push("/admin/assets")
                }}
              >
                <Database className="h-4 w-4" />
                Asset Hierarchy
              </button>
            )}

            {/* Risk Assessment */}
            {hasPermission("risk_assessment") && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  setIsOpen(false)
                  router.push("/risk-assessment")
                }}
              >
                <FileText className="h-4 w-4" />
                Risk Assessment
              </button>
            )}

            {/* Settings - Available to all users */}
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                setIsOpen(false)
                router.push("/settings")
              }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>

            {/* Logout - Available to all users */}
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 