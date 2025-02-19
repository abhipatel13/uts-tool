"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/auth/login")
    }
  }, [router])

  return <>{children}</>
}