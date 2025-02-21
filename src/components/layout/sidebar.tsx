"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, Shield, ClipboardCheck, BarChart3, Settings, ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { LucideIcon } from "lucide-react"

interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  subItems?: NavItem[];
}

const sidebarNavItems: NavItem[] = [
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
    ],
  },
  {
    title: "Inspections",
    href: "/inspections",
    icon: ClipboardCheck,
  },
  {
    title: "Reporting",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Configurations",
    href: "/configurations",
    icon: Settings,
    subItems: [
      {
        title: "Admin",
        href: "/configurations/admin",
        subItems: [
          { title: "Users", href: "/configurations/admin/users" },
          { title: "Asset Hierarchy", href: "/configurations/admin/asset-hierarchy" },
          { title: "Licensing/Subscription", href: "/configurations/admin/licensing" },
        ]
      },
      {
        title: "GeoFencing",
        href: "/configurations/geofencing",
        subItems: [
          { title: "Bluetooth", href: "/configurations/geofencing/bluetooth" },
          { title: "GPS", href: "/configurations/geofencing/gps" },
        ]
      },
      {
        title: "Templates",
        href: "/configurations/templates",
        subItems: [
          { 
            title: "Risk Matrix", 
            href: "/configurations/templates/risk-matrix",
            subItems: [
              { title: "Personnel", href: "/configurations/template/risk-matrix/personnel" },
              { title: "Maintenance", href: "/configurations/template/risk-matrix/maintenance" },
              { title: "Revenue", href: "/configurations/template/risk-matrix/revenue" },
              { title: "Process", href: "/configurations/template/risk-matrix/process" },
              { title: "Environmental", href: "/configurations/template/risk-matrix/environmental" },
            ]
          },
          { title: "Mitigating Action Type", href: "/configurations/templates/mitigating-action" },
          { title: "General Risks", href: "/configurations/templates/general-risks" },
        ]
      }
    ],
  },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const router = useRouter()

  const toggleSubmenu = (href: string) => {
    setExpandedMenus(current => 
      current.includes(href) 
        ? current.filter(item => item !== href)
        : [...current, href]
    )
  }

  const handleMenuClick = (item: NavItem) => {
    if (item.subItems) {
      toggleSubmenu(item.href)
    } else {
      router.push(item.href)
      setIsMobileOpen(false)
    }
  }

  const SidebarContent = () => {
    const pathname = usePathname()

    return (
      <>
        <div className={cn(
          "px-4 py-2 flex items-center",
          isCollapsed ? "justify-center" : "justify-center",
          // "mt-10"
        )}>
          <Image 
            src="/uts-logo.jpg" 
            alt="UTS Logo" 
            className={cn(
              "transition-all duration-300 rounded-lg",
              isCollapsed ? "h-8 w-8" : "h-24 w-auto"
            )} 
            width={210}
            height={64}
            priority
          />
        </div>

        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-4 py-4">
            {sidebarNavItems.map((item) => (
              <div key={item.href} className="px-3 py-2">
                <div 
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-white hover:bg-[#34495E] cursor-pointer",
                    pathname === item.href && "bg-[#34495E]"
                  )}
                  onClick={() => handleMenuClick(item)}
                >
                  <div className="flex items-center gap-3">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {!isCollapsed && <span>{item.title}</span>}
                  </div>
                  {!isCollapsed && item.subItems && (
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedMenus.includes(item.href) && "transform rotate-90"
                      )}
                    />
                  )}
                </div>
                {!isCollapsed && item.subItems && expandedMenus.includes(item.href) && (
                  <div className="mt-2 space-y-1 pl-4">
                    {item.subItems.map((subItem) => (
                      <div key={subItem.href}>
                        <div 
                          className={cn(
                            "flex items-center justify-between rounded-md px-3 py-2 text-white hover:bg-[#34495E] cursor-pointer",
                            pathname === subItem.href && "bg-[#34495E]"
                          )}
                          onClick={() => handleMenuClick(subItem)}
                        >
                          <span>{subItem.title}</span>
                          {subItem.subItems && (
                            <ChevronRight 
                              className={cn(
                                "h-4 w-4 transition-transform",
                                expandedMenus.includes(subItem.href) && "transform rotate-90"
                              )}
                            />
                          )}
                        </div>
                        {subItem.subItems && expandedMenus.includes(subItem.href) && (
                          <div className="mt-2 space-y-1 pl-4">
                            {subItem.subItems.map((nestedItem) => (
                              <div key={nestedItem.href}>
                                <div
                                  className={cn(
                                    "rounded-md px-3 py-2 text-white hover:bg-[#34495E] cursor-pointer",
                                    pathname === nestedItem.href && "bg-[#34495E]"
                                  )}
                                  onClick={() => {
                                    if (nestedItem.subItems) {
                                      handleMenuClick(nestedItem)
                                    } else {
                                      router.push(nestedItem.href)
                                      setIsMobileOpen(false)
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{nestedItem.title}</span>
                                    {nestedItem.subItems && (
                                      <ChevronRight 
                                        className={cn(
                                          "h-3.5 w-3.5 transition-transform duration-200",
                                          expandedMenus.includes(nestedItem.href) && "transform rotate-90"
                                        )}
                                      />
                                    )}
                                  </div>
                                </div>
                                {nestedItem.subItems && expandedMenus.includes(nestedItem.href) && (
                                  <div className="ml-4 mt-1">
                                    {nestedItem.subItems.map((deepItem) => (
                                      <div
                                        key={deepItem.href}
                                        className={cn(
                                          "rounded-md px-3 py-2 text-white hover:bg-[#34495E]/60 cursor-pointer",
                                          pathname === deepItem.href && "bg-[#34495E]"
                                        )}
                                        onClick={() => {
                                          router.push(deepItem.href)
                                          setIsMobileOpen(false)
                                        }}
                                      >
                                        {deepItem.title}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-2 left-2 z-50 lg:hidden"
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
        <div className="fixed inset-y-0 left-0 w-64 bg-[#2C3E50] pt-4">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "relative hidden lg:block bg-[#2C3E50] h-screen transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-4 h-6 w-6 rounded-full border bg-background"
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