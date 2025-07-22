"use client"

import { CommonButton } from "@/components/ui/common-button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/utils/auth"
import { LicenseAllocationService } from "@/services/licenseService"
import { Shield, AlertTriangle, Clock, XCircle } from "lucide-react"

export default function Unauthorized() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<{ role: string; id?: number } | null>(null)
  const [licenseStatus, setLicenseStatus] = useState<{
    hasActiveLicense: boolean;
    activeAllocations: Array<{ id: number; status: string; expiry_date: string }>;
    expiredAllocations: Array<{ id: number; status: string; expiry_date: string }>;
    upcomingAllocations: Array<{ id: number; status: string; expiry_date: string }>;
  } | null>(null)
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
            setLicenseStatus(response.data)
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
    
    if (!licenseStatus) {
      return { icon: AlertTriangle, title: "License Check Failed", message: "Unable to verify your license status. Please try again or contact support." }
    }
    
    if (!licenseStatus.hasActiveLicense) {
      if (licenseStatus.expiredAllocations.length > 0) {
        return { icon: Clock, title: "License Expired", message: "Your license has expired. Please contact your administrator to renew your license." }
      }
      
      if (licenseStatus.upcomingAllocations.length > 0) {
        return { icon: Clock, title: "License Not Yet Active", message: "Your license is scheduled to become active soon. Please wait or contact your administrator." }
      }
      
      return { icon: XCircle, title: "No Valid License", message: "You don't have an active license. Please contact your administrator to get a license assigned." }
    }
    
    return { icon: Shield, title: "Insufficient Permissions", message: "You don't have the required permissions to access this page." }
  }

  const { icon: Icon, title, message } = getAccessIssueInfo()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center">
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
            
            {licenseStatus && user.role !== 'superuser' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Active licenses: <span className="font-medium">{licenseStatus.activeAllocations.length}</span>
                </p>
                {licenseStatus.expiredAllocations.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Expired licenses: <span className="font-medium">{licenseStatus.expiredAllocations.length}</span>
                  </p>
                )}
                {licenseStatus.upcomingAllocations.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Upcoming licenses: <span className="font-medium">{licenseStatus.upcomingAllocations.length}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          <CommonButton 
            onClick={() => router.push("/")}
          >
            Go to Home
          </CommonButton>
          
          <CommonButton 
            onClick={() => router.push("/auth/login")}
            variant="outline"
          >
            Switch Account
          </CommonButton>
          
          {user && user.role !== 'superuser' && !licenseStatus?.hasActiveLicense && (
            <CommonButton 
              onClick={() => router.push("/admin/license-management")}
              variant="info"
            >
              View License Management
            </CommonButton>
          )}
        </div>
      </div>
    </div>
  )
} 