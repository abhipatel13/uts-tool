"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated, getCurrentUser } from "@/utils/auth"
import { LicenseAllocationService } from "@/services/licenseService"
import { Loader2 } from "lucide-react"

interface GlobalLicenseProtectionProps {
  children: React.ReactNode
}

export default function GlobalLicenseProtection({
  children
}: GlobalLicenseProtectionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip license check on auth and unauthorized pages
        const publicPages = ["/auth/login", "/unauthorized", "/auth/resetpassword"]
        // Some public routes use dynamic segments (e.g., /auth/resetpassword/[token])
        const publicPrefixes = ["/auth/resetpassword"]
        const isPublicRoute = publicPages.includes(pathname || "") ||
          (!!pathname && publicPrefixes.some(prefix => pathname.startsWith(prefix)))
        if (isPublicRoute) {
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

        // Superusers bypass all license checks
        if (user.role === 'superuser') {
          setIsAuthorized(true)
          setIsLoading(false)
          return
        }

        // For admin, supervisor, user - check if they have ANY allocated license
        if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'user') {
          
          // Validate user ID
          if (!user.id) {
            console.error("User ID is missing or invalid:", user.id);
            router.push("/unauthorized")
            return
          }
          
          // Convert user.id to number if it's a string
          const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
          
          if (isNaN(userId)) {
            console.error("User ID is not a valid number:", user.id);
            router.push("/unauthorized")
            return
          }
          
          try {
            const licenseResponse = await Promise.race([
              LicenseAllocationService.getUserLicenseStatus(userId),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('License check timeout')), 10000)
              )
            ]);
            
            if (!licenseResponse?.status) {
              router.push("/unauthorized")
              return
            }
            
            const hasActiveLicense = licenseResponse.data?.hasActiveLicense;
            
            if (!hasActiveLicense) {
              router.push("/unauthorized")
              return
            }
            
          } catch (licenseError) {
            console.error("License check failed:", licenseError);
            router.push("/unauthorized")
            return
          }
        }

        // All checks passed  
        setIsAuthorized(true)
        setIsLoading(false)

      } catch (error) {
        console.error('Auth check error:', error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router, pathname])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Validating license and permissions...</p>
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