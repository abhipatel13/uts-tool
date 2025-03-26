"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

// Hardcoded valid credentials
const VALID_CREDENTIALS = [
  {
    email: "jagpreet.a@utahtechnicalservicesllc.com",
    password: "test",
    company: "UTAH TECH SERVICES"
  },
  {
    email: "jagpreet.a@utahtechnicalservicesllc.com",
    password: "test",
    company: "Utah Technical Services"
  },
  {
    email: "jagpreet.a@utahtechnicalservicesllc.com",
    password: "test",
    company: "Utah Technical Services LLC"
  }
]

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    company: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
    if (!formData.email || !formData.password || !formData.company) {
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
      // Check against hardcoded credentials
      const isValidUser = VALID_CREDENTIALS.some(
        cred => 
          cred.email === formData.email && 
          cred.password === formData.password &&
          cred.company === formData.company
      )

      if (isValidUser) {
        // Store user info in localStorage
        localStorage.setItem("user", JSON.stringify({
          email: formData.email,
          company: formData.company,
          isAuthenticated: true
        }))
        router.push("/")
      } else {
        setError("Invalid credentials")
      }
    } catch {
      setError("An error occurred during login")
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
              required
              placeholder="Enter your company name"
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[rgb(44,62,80)] hover:bg-[rgb(44,62,80)]/90"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  )
} 