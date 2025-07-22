"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogoutButton } from "@/components/logout-button"
import { getCurrentUser } from "@/utils/auth"
import Link from 'next/link'
import NotificationBell from "../NotificationBell"

export function Header() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showBackButton, setShowBackButton] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    setUser(getCurrentUser())
  }, [])

  useEffect(() => {
    // Show back button on all pages except dashboard and login
    const shouldShowBack = pathname ? !['/', '/auth/login'].includes(pathname) : false
    setShowBackButton(shouldShowBack)
  }, [pathname])

  const userInitials = mounted && user?.email ? user.email.substring(0, 2).toUpperCase() : "U"

  const getThemeColor = () => {
    return "border-[#34495E] text-[#34495E] hover:bg-[#34495E] hover:text-white"
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <header className="h-16 min-h-[64px] max-h-[64px] border-b bg-white px-6 flex items-center justify-between sticky top-0 z-50" style={{ height: '64px' }}>
      {/* Left side - Back button */}
      <div className="flex items-center">
        {showBackButton && (
          <button
            onClick={handleBack}
            className={`${getThemeColor()} flex items-center gap-1.5 px-3 py-2 text-sm border rounded-md h-9 transition-colors duration-200 mr-4`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* Right side - Notifications and Profile */}
      <div className="flex items-center gap-4">
        <NotificationBell />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/user.png" alt="User" />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email || "User"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/configurations/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 cursor-pointer">
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
} 