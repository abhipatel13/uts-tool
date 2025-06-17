"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export function LogoutButton() {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      
      // Clear all auth data from localStorage
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      
      // Clear any other stored data
      sessionStorage.clear()
      
      // Show success message
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
      
      // Redirect to login page
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      
      // Even if the API call fails, still clear local data and redirect
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      sessionStorage.clear()
      
      toast({
        title: "Logged out",
        description: "You have been logged out of your account.",
        variant: "destructive",
      })
      
      router.push("/auth/login")
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="flex items-center gap-2"
    >
      <LogOut size={16} />
      Logout
    </Button>
  )
} 