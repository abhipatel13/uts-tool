"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from 'next/image'

interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  subItems?: NavItem[];
  iconBg?: string;
}

const CustomIcons = {
  AssetHierarchy: ({ className }: { className?: string }) => (
    <div className={className}>
    <Image
      src="/asset-hierarchy.png"
      alt="Asset Hierarchy"
      width={60}
      height={60}
      priority
    />
  </div>
  ),
  Safety: ({ className }: { className?: string }) => (
    <div className={className}>
      <Image
        src="/safety-hat.png"
        alt="Safety"
        width={60}
        height={60}
        priority
      />
    </div>
  ),
  Analytics: ({ className }: { className?: string }) => (
    <div className={className}>
      <Image
        src="/analytics.png"
        alt="Analytics"
        width={60}
        height={60}
        priority
      />
    </div>
  ),
  Configurations: ({ className }: { className?: string }) => (
    <div className={className}>
      <Image
        src="/configurations.png"
        alt="Configurations"
        width={60}
        height={60}
        priority
      />
    </div>
  ),
}

const sidebarNavItems: NavItem[] = [
  {
    title: "Asset Hierarchy",
    href: "/asset-hierarchy",
    icon: CustomIcons.AssetHierarchy,
    iconBg: "bg-[#3498DB]", 
  },
  {
    title: "Safety",
    href: "/safety",
    icon: CustomIcons.Safety,
    iconBg: "bg-[#2ECC71]",
    subItems: [
      { title: "Task Hazard", href: "/safety/task-hazard" },
      { title: "Risk Assessment", href: "/safety/risk-assessment" },
    ],
  },
  {
    title: "Analytics / Reporting",
    href: "/analytics",
    icon: CustomIcons.Analytics,
    iconBg: "bg-[#E67E22]",
    subItems: [
      { title: "Task Hazard", href: "/analytics/task-hazard" },
      { title: "Risk Assessment", href: "/analytics/risk-assessment" },
    ],
  },
  {
    title: "Configurations",
    href: "/configurations",
    icon: CustomIcons.Configurations,
    iconBg: "bg-[#E74C3C]", 
    subItems: [
      {
        title: "Admin",
        href: "/configurations/admin",
        subItems: [
          { title: "Users", href: "/configurations/admin/users" },
          { title: "Data Loader", href: "/configurations/admin/data-loader" },
          { title: "Licensing/subscription", href: "/configurations/admin/licensing" },
        ]
      },
      {
        title: "Preferences",
        href: "/configurations/preferences",
        subItems: [
          { title: "Mitigating Action Trigger", href: "/configurations/preferences/mitigating-action-trigger" },
        ]
      },
      {
        title: "Templates",
        href: "/configurations/templates",
        subItems: [
          { title: "Risk Matrix", href: "/configurations/template/risk-matrix" },
          { title: "Mitigating Action Type", href: "/configurations/template/mitigating-action-type" },
          { title: "General Risks", href: "/configurations/template/general-risks" },
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
  const pathname = usePathname()

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 bg-[rgb(52,73,94)] h-[100dvh] transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        "hidden lg:block"
      )}>
        {/* Logo Section */}
        <div className={cn(
          "px-6 py-4 flex items-center border-b border-[#2C3E50] shrink-0 bg-[#2C3E50]",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-xl flex items-center justify-center">
              <Image 
                src="/performanceark.png" 
                alt="Logo" 
                className={cn(
                  "transition-all duration-300 rounded-lg",
                  isCollapsed ? "h-8 w-8" : "h-10 w-auto"
                )} 
                width={210}
                height={64}
                priority
              />
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 min-h-0 h-[calc(100dvh-4rem)]">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <div className="py-4">
              {sidebarNavItems.map((item) => (
                <div key={item.href} className="px-3 mb-2">
                  <div 
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 text-white hover:bg-[#2C3E50] rounded-lg cursor-pointer",
                      pathname === item.href && "bg-[#2C3E50] text-white"
                    )}
                    onClick={() => handleMenuClick(item)}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon && (
                        <div 
                      >
                          <item.icon className="h-8 w-8 text-white" />
                        </div>
                      )}
                      {!isCollapsed && <span className="text-sm text-white">{item.title}</span>}
                    </div>
                    {!isCollapsed && item.subItems && (
                      <ChevronRight 
                        className={cn(
                          "h-4 w-4 transition-transform text-white",
                          expandedMenus.includes(item.href) && "transform rotate-90"
                        )}
                      />
                    )}
                  </div>
                  {!isCollapsed && item.subItems && expandedMenus.includes(item.href) && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.subItems.map((subItem) => (
                        <div key={subItem.href}>
                          <div 
                            className={cn(
                              "flex items-center justify-between px-3 py-2 text-white/90 hover:bg-[#2C3E50] hover:text-white rounded-lg cursor-pointer text-sm",
                              pathname === subItem.href && "bg-[#2C3E50] text-white"
                            )}
                            onClick={() => handleMenuClick(subItem)}
                          >
                            <span>{subItem.title}</span>
                            {subItem.subItems && (
                              <ChevronRight 
                                className={cn(
                                  "h-3 w-3 transition-transform text-white/90",
                                  expandedMenus.includes(subItem.href) && "transform rotate-90"
                                )}
                              />
                            )}
                          </div>
                          {subItem.subItems && expandedMenus.includes(subItem.href) && (
                            <div className="mt-1 ml-3 space-y-1">
                              {subItem.subItems.map((nestedItem) => (
                                <div
                                  key={nestedItem.href}
                                  className={cn(
                                    "px-3 py-2 text-white/80 hover:bg-[#2C3E50] hover:text-white rounded-lg cursor-pointer text-sm",
                                    pathname === nestedItem.href && "bg-[#2C3E50] text-white"
                                  )}
                                  onClick={() => router.push(nestedItem.href)}
                                >
                                  {nestedItem.title}
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
          </div>
        </div>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-[#1B2631] text-white hover:bg-[#2C3E50] z-20"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className={cn(
        "min-h-[100dvh] transition-all duration-300 bg-gray-50",
        isCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* <main className="h-full">
          {children}
        </main> */}
      </div>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-2 left-2 z-50 lg:hidden text-white"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/80" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-[#1B2631]">
            <div className="flex flex-col h-[100dvh]">
              {/* Mobile Logo */}
              <div className="px-6 py-4 flex items-center border-b border-[#2C3E50] shrink-0 bg-[#2C3E50]">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2.5 rounded-xl w-[92px] h-[92px] flex items-center justify-center">
                    <Image 
                      src="/performanceark.png" 
                      alt="Logo" 
                      className="w-[90px] h-[90px]"
                      width={92}
                      height={92}
                      priority
                    />
                  </div>
                </div>
              </div>
              {/* Mobile Navigation */}
              <div className="flex-1 min-h-0 h-[calc(100dvh-4rem)]">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  <div className="py-4">
                    {sidebarNavItems.map((item) => (
                      <div key={item.href} className="px-3 mb-2">
                        <div 
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 text-white hover:bg-[#2C3E50] rounded-lg cursor-pointer",
                            pathname === item.href && "bg-[#2C3E50] text-white"
                          )}
                          onClick={() => handleMenuClick(item)}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon && (
                              <div className={cn(
                                "p-1.5 rounded-lg",
                                item.iconBg
                              )}>
                                <item.icon className="h-8 w-8 text-white" />
                              </div>
                            )}
                            <span className="text-sm text-white">{item.title}</span>
                          </div>
                          {item.subItems && (
                            <ChevronRight 
                              className={cn(
                                "h-4 w-4 transition-transform text-white",
                                expandedMenus.includes(item.href) && "transform rotate-90"
                              )}
                            />
                          )}
                        </div>
                        {item.subItems && expandedMenus.includes(item.href) && (
                          <div className="mt-1 ml-4 space-y-1">
                            {item.subItems.map((subItem) => (
                              <div key={subItem.href}>
                                <div 
                                  className={cn(
                                    "flex items-center justify-between px-3 py-2 text-white/90 hover:bg-[#2C3E50] hover:text-white rounded-lg cursor-pointer text-sm",
                                    pathname === subItem.href && "bg-[#2C3E50] text-white"
                                  )}
                                  onClick={() => handleMenuClick(subItem)}
                                >
                                  <span>{subItem.title}</span>
                                  {subItem.subItems && (
                                    <ChevronRight 
                                      className={cn(
                                        "h-3 w-3 transition-transform text-white/90",
                                        expandedMenus.includes(subItem.href) && "transform rotate-90"
                                      )}
                                    />
                                  )}
                                </div>
                                {subItem.subItems && expandedMenus.includes(subItem.href) && (
                                  <div className="mt-1 ml-3 space-y-1">
                                    {subItem.subItems.map((nestedItem) => (
                                      <div
                                        key={nestedItem.href}
                                        className={cn(
                                          "px-3 py-2 text-white/80 hover:bg-[#2C3E50] hover:text-white rounded-lg cursor-pointer text-sm",
                                          pathname === nestedItem.href && "bg-[#2C3E50] text-white"
                                        )}
                                        onClick={() => router.push(nestedItem.href)}
                                      >
                                        {nestedItem.title}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}