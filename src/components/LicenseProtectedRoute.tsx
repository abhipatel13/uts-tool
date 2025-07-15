"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated, hasRole, hasPermission, getCurrentUser } from "@/utils/auth"
import { LicenseAllocationService } from "@/services/licenseService"
import { Loader2 } from "lucide-react"

interface LicenseProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredPermission?: string
}

export default function LicenseProtectedRoute({
  children,
  requiredRole,
  requiredPermission
}: LicenseProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip all checks on auth and unauthorized pages
        if (pathname === "/auth/login" || pathname === "/unauthorized") {
          setIsAuthorized(true)
          setIsLoading(false)
          return
        }

        // Check authentication first
        if (!isAuthenticated()) {
          router.push("/auth/login")
          return
        }

        const user = getCurrentUser();

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Check role requirements
        if (requiredRole && !hasRole(requiredRole)) {
          router.push("/unauthorized")
          return
        }

        // Check permission requirements
        if (requiredPermission && !hasPermission(requiredPermission)) {
          router.push("/unauthorized")
          return
        }

        // All checks passed - license check is handled globally
        setIsAuthorized(true)
        setIsLoading(false)

      } catch (error) {
        console.error('Auth check error:', error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router, requiredRole, requiredPermission, pathname])

  // Show loading state
  if (isLoading) {
    return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Validating role permissions...</p>
        </div>
      </div>
    )
  }

  // Show content if authorized
  if (isAuthorized) {
    return <>{children}</>
  }

  // Don't show anything if not authorized (redirect should be in progress)
  return null
} 