"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, Shield, ClipboardCheck, BarChart3, Settings, ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from 'next/image'

const sidebarNavItems = [
  {
    title: "Asset Hierarchy",
    href: "/asset-hierarchy",
    icon: Building2,
  },
  {
    title: "Safety",
    href: "/safety",
    icon: Shield,
    subItems: [
      { title: "Task Hazard", href: "/safety/task-hazard" },
      { title: "Risk Assessment", href: "/safety/risk-assessment" },
      { title: "Criticality", href: "/safety/criticality" }
    ],
  },
  {
    title: "Inspections / Tasks",
    href: "/inspections",
    icon: ClipboardCheck,
  },
  {
    title: "Analytics / Reporting",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Configurations",
    href: "/configurations",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const SidebarContent = () => (
    <>
      <div className={cn(
        "px-4 py-2",
        isCollapsed && "flex justify-center"
      )}>
        <Image 
          src="/uts-logo.jpg" 
          alt="UTS Logo" 
          className={cn(
            "transition-all duration-300 rounded-lg",
            isCollapsed ? "h-8 w-8" : "h-24"
          )} 
          width={100}
          height={100}
        />
      </div>

      <ScrollArea className="h-[calc(100vh-64px)] px-3">
        <div className="space-y-4 py-4">
          {sidebarNavItems.map((item) => (
            <div key={item.href} className="px-3 py-2">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-white hover:bg-[#34495E]",
                  pathname === item.href && "bg-[#34495E]"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </div>
                {!isCollapsed && item.subItems && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Link>
              {!isCollapsed && item.subItems && (
                <div className="mt-2 space-y-1 pl-7">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm text-white hover:bg-[#34495E]",
                        pathname === subItem.href && "bg-[#34495E]"
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden",
        isMobileOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/80" onClick={() => setIsMobileOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-[#2C3E50] pt-16">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "relative hidden lg:block border-r bg-[#2C3E50] pt-16 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <SidebarContent />
      </div>
    </>
  )
}