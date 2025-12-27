"use client"

import { CommonButton } from "@/components/ui/common-button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { setAuthToken, setUserData } from "@/utils/auth"
import { AuthApi } from "@/services"

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    company: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResetEmailDialogOpen, setIsResetEmailDialogOpen] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      router.push("/")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      // Authenticate with backend API
      const response = await AuthApi.login({
        email: formData.email,
        password: formData.password,
        company: formData.company
      })
      
      // Check if the response contains user data and token
      if (!response.status) {
        throw new Error("Invalid response from server")
      }
      
      const { user, token } = response.data

      setUserData({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        isAuthenticated: true
      })
      
      setAuthToken(token)

      router.push("/")
    } catch (apiError: unknown) {
      console.error("API login error:", apiError)
      if (apiError instanceof Error) {
        setError(apiError.message)
      } else {
        setError("Login failed. Please check your credentials and try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      // Basic email validation
      if (!formData.email) {
        setError("Please enter your email to reset your password")
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address")
        return
      }
      const response = await AuthApi.forgotPassword({
        email: formData.email
      })
      if (!response || !response.status) {
        throw new Error(response?.message || "Failed to send reset email")
      }
      setIsResetEmailDialogOpen(true)
    } catch (apiError: unknown) {
      console.error("API forgot password error:", apiError)
      if (apiError instanceof Error) {
        setError(apiError.message)
      } else {
        setError("Failed to send password reset email. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-[rgb(44,62,80)]">Login</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter your email"
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter your password"
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Company</label>
            <Input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Enter your company name"
              className="w-full"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-between">
          <CommonButton
          type="button"
          disabled={isLoading}
          onClick={handleForgotPassword}
          >
            Forgot Password
          </CommonButton>

          <CommonButton
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </CommonButton>
          </div>
        </form>
      </div>

      {/* Forgot Password Confirmation Dialog */}
      <Dialog open={isResetEmailDialogOpen} onOpenChange={setIsResetEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check your email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              If an account exists for <span className="font-medium">{formData.email}</span>, we sent a password reset link.
              Please check your inbox and spam folder. The link will expire after a short time.
            </p>
            <div className="flex justify-end">
              <CommonButton onClick={() => setIsResetEmailDialogOpen(false)}>
                OK
              </CommonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 