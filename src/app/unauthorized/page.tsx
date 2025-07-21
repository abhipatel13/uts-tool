"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/utils/auth"
import { BackButton } from "@/components/ui/back-button"
import { LicenseAllocationService } from "@/services"
import { Shield, AlertTriangle, Clock, XCircle } from "lucide-react"
import { LicenseAllocation } from "@/types"

export default function Unauthorized() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<{ role: string; id?: number } | null>(null)
  const [licenseAllocation, setLicenseAllocation] = useState<LicenseAllocation | null>(null)
  const [isLoadingLicense, setIsLoadingLicense] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentUser = getCurrentUser()
    setUser(currentUser)
    
    // Check license status for non-superuser roles
    if (currentUser && currentUser.role !== 'superuser' && currentUser.id) {
      setIsLoadingLicense(true)
      LicenseAllocationService.getUserLicenseStatus(currentUser.id)
        .then(response => {
          if (response?.status) {
            const licenseAllocation = response.data.activeAllocations.length > 0 
            ? response.data.activeAllocations[0] 
            : response.data.expiredAllocations.length > 0
            ? response.data.expiredAllocations[0]
            : response.data.upcomingAllocations.length > 0
            ? response.data.upcomingAllocations[0]
            : null
            setLicenseAllocation(licenseAllocation)
          }
        })
        .catch(error => {
          console.error('Failed to fetch license status:', error)
        })
        .finally(() => {
          setIsLoadingLicense(false)
        })
    }
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getAccessIssueInfo = () => {
    if (!user) return { icon: XCircle, title: "Authentication Required", message: "Please log in to access this application." }
    
    if (user.role === 'superuser') {
      return { icon: Shield, title: "Access Denied", message: "You don't have permission to access this specific page." }
    }
    
    if (isLoadingLicense) {
      return { icon: Clock, title: "Checking License", message: "Validating your license status..." }
    }
    
    if (!licenseAllocation) {
      return { icon: AlertTriangle, title: "License Check Failed", message: "Unable to verify your license status. Please try again or contact support." }
    }
    
    // Check if the license is active
    const isActive = licenseAllocation.status === 'active'
    const isExpired = licenseAllocation.status === 'expired'
    const isAllocated = licenseAllocation.status === 'allocated'
    
    if (!isActive && !isAllocated) {
      if (isExpired) {
        return { icon: Clock, title: "License Expired", message: "Your license has expired. Please contact your administrator to renew your license." }
      }
      
      return { icon: XCircle, title: "No Valid License", message: "You don't have an active license. Please contact your administrator to get a license assigned." }
    }
    
    return { icon: Shield, title: "Insufficient Permissions", message: "You don't have the required permissions to access this page." }
  }

  const { icon: Icon, title, message } = getAccessIssueInfo()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center">
        <div className="mb-6">
          <BackButton text="Back" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-[rgb(44,62,80)]">{title}</h1>
        
        <div className="mb-6">
          <Icon className="mx-auto h-16 w-16 text-red-500" />
        </div>
        
        <p className="text-gray-600 mb-4">{message}</p>
        
        {user && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-500 mb-2">
              Your current role: <span className="font-medium">{user.role}</span>
            </p>
            
            {licenseAllocation && user.role !== 'superuser' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  License status: <span className="font-medium">{licenseAllocation.status}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Valid from: <span className="font-medium">{new Date(licenseAllocation.validFrom).toLocaleDateString()}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Valid until: <span className="font-medium">{new Date(licenseAllocation.validUntil).toLocaleDateString()}</span>
                </p>
                {licenseAllocation.licensePool && (
                  <p className="text-sm text-gray-500">
                    License type: <span className="font-medium">{licenseAllocation.licensePool.licenseType}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={() => router.push("/")}
            className="bg-[rgb(44,62,80)] hover:bg-[rgb(44,62,80)]/90"
          >
            Go to Home
          </Button>
          
          <Button 
            onClick={() => router.push("/auth/login")}
            variant="outline"
          >
            Switch Account
          </Button>
          
          {user && user.role !== 'superuser' && licenseAllocation && licenseAllocation.status !== 'active' && (
            <Button 
              onClick={() => router.push("/configurations/admin/licensing")}
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              View License Management
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 