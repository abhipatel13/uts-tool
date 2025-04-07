"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, Users, Shield, FileText, Database, Settings } from "lucide-react"
import { getCurrentUser } from "@/utils/auth"
import { ProfileMenu } from "./ProfileMenu"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const user = getCurrentUser()

  if (!user) return null

  const isActive = (path: string) => pathname === path

  // Determine which menu items to show based on user role
  const showUsers = user.role === "superuser" || user.role === "admin"
  const showLicenses = user.role === "superuser" || user.role === "admin"
  const showAssets = user.role === "superuser" || user.role === "admin"
  const showRiskAssessment = user.role === "superuser" || user.role === "supervisor"
  const showRiskAssessmentCreation = user.role === "superuser" || user.role === "user"

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-[rgb(44,62,80)]">
                UTAH TECH
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* Home - Available to all users */}
              <Link
                href="/"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive("/")
                    ? "border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>

              {/* Admin Features */}
              {showUsers && (
                <Link
                  href="/admin/users"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    isActive("/admin/users")
                      ? "border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Users
                </Link>
              )}

              {/* Licensing Management */}
              {showLicenses && (
                <Link
                  href="/admin/licenses"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    isActive("/admin/licenses")
                      ? "border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Licenses
                </Link>
              )}

              {/* Asset Hierarchy */}
              {showAssets && (
                <Link
                  href="/admin/assets"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    isActive("/admin/assets")
                      ? "border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  <Database className="h-4 w-4 mr-1" />
                  Assets
                </Link>
              )}

              {/* Risk Assessment */}
              {showRiskAssessment && (
                <Link
                  href="/risk-assessment"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    isActive("/risk-assessment")
                      ? "border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Risk Assessment
                </Link>
              )}

              {/* Create Risk Assessment */}
              {showRiskAssessmentCreation && (
                <Link
                  href="/risk-assessment/create"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    isActive("/risk-assessment/create")
                      ? "border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Create Assessment
                </Link>
              )}

              {/* Settings - Available to all users */}
              <Link
                href="/settings"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive("/settings")
                    ? "border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <ProfileMenu />
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgb(44,62,80)]"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {/* Home - Available to all users */}
            <Link
              href="/"
              className={cn(
                "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                isActive("/")
                  ? "bg-[rgb(44,62,80)]/10 border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Home
              </div>
            </Link>

            {/* Admin Features */}
            {showUsers && (
              <Link
                href="/admin/users"
                className={cn(
                  "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                  isActive("/admin/users")
                    ? "bg-[rgb(44,62,80)]/10 border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                )}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </div>
              </Link>
            )}

            {/* Licensing Management */}
            {showLicenses && (
              <Link
                href="/admin/licenses"
                className={cn(
                  "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                  isActive("/admin/licenses")
                    ? "bg-[rgb(44,62,80)]/10 border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                )}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Licenses
                </div>
              </Link>
            )}

            {/* Asset Hierarchy */}
            {showAssets && (
              <Link
                href="/admin/assets"
                className={cn(
                  "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                  isActive("/admin/assets")
                    ? "bg-[rgb(44,62,80)]/10 border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                )}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Assets
                </div>
              </Link>
            )}

            {/* Risk Assessment */}
            {showRiskAssessment && (
              <Link
                href="/risk-assessment"
                className={cn(
                  "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                  isActive("/risk-assessment")
                    ? "bg-[rgb(44,62,80)]/10 border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                )}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Risk Assessment
                </div>
              </Link>
            )}

            {/* Create Risk Assessment */}
            {showRiskAssessmentCreation && (
              <Link
                href="/risk-assessment/create"
                className={cn(
                  "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                  isActive("/risk-assessment/create")
                    ? "bg-[rgb(44,62,80)]/10 border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                )}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Assessment
                </div>
              </Link>
            )}

            {/* Settings - Available to all users */}
            <Link
              href="/settings"
              className={cn(
                "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                isActive("/settings")
                  ? "bg-[rgb(44,62,80)]/10 border-[rgb(44,62,80)] text-[rgb(44,62,80)]"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </div>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
} 