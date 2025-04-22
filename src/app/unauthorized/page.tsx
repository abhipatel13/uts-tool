"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/utils/auth"

export default function Unauthorized() {
  const router = useRouter()
  const user = getCurrentUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-[rgb(44,62,80)]">Access Denied</h1>
        
        <div className="mb-6">
          <svg 
            className="mx-auto h-16 w-16 text-red-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <p className="text-gray-600 mb-4">
          You don&apos;t have permission to access this page.
        </p>
        
        {user && (
          <p className="text-sm text-gray-500 mb-6">
            Your current role: <span className="font-medium">{user.role}</span>
          </p>
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
        </div>
      </div>
    </div>
  )
} 