"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated, hasRole, hasPermission } from "@/utils/auth"
import { Loader2 } from "lucide-react"

interface LicenseProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredPermission?: string
  bypassLicenseCheck?: boolean // For superuser and specific admin pages
}

export default function LicenseProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  bypassLicenseCheck = false
}: LicenseProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Ensure component only runs auth checks on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only run auth checks after component has mounted on client side
    if (!mounted) return

    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          router.push("/auth/login")
          return
        }

        // Check role if required
        if (requiredRole && !hasRole(requiredRole)) {
          router.push("/unauthorized")
          return
        }

        // Check permission if required
        if (requiredPermission && !hasPermission(requiredPermission)) {
          router.push("/unauthorized")
          return
        }

        // License validation is disabled - all users are considered to have valid licenses
        // No license check needed

        // User is authorized
        setIsAuthorized(true)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole, requiredPermission, bypassLicenseCheck, pathname, mounted])

  // Show loading state until mounted and auth check completes
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Validating access permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
} 