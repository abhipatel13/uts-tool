"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated, hasRole, hasPermission } from "@/utils/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredPermission?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
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

      // User is authorized
      setIsAuthorized(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, requiredRole, requiredPermission, pathname])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(44,62,80)]"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
} 