"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Menu, X, Settings, CreditCard } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { getCurrentUser, hasPermission } from "@/utils/auth"

interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  subItems?: NavItem[];
  iconBg?: string;
  description?: string;
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
  Tactics: ({ className }: { className?: string }) => (
    <div className={cn("p-2 rounded-full flex items-center justify-center bg-[#E74C3C]", className)}>
      <Settings className="w-6 h-6 text-white" />
    </div>
  ),
  Payments: ({ className }: { className?: string }) => (
    <div className={cn("p-2 rounded-full flex items-center justify-center bg-[#9B59B6]", className)}>
      <CreditCard className="w-6 h-6 text-white" />
    </div>
  ),
}

// Define the sidebar navigation items
const getSidebarNavItems = (user: { role: string } | null) => {
  if (!user) return [];

  // Determine which menu items to show based on user role and permissions
  const showUsers = user.role === "superuser" || user.role === "admin";
  const showLicenses = user.role === "superuser" || user.role === "admin";
  const showAssets = hasPermission("view_asset_hierarchy") || hasPermission("asset_hierarchy");
  const showTaskHazard = user.role === "superuser" || user.role === "admin" || user.role === "supervisor";
  const showRiskAssessment = user.role === "superuser" || user.role === "admin" || user.role === "supervisor" || user.role === "user";
  const showConfigurations = user.role === "superuser" || user.role === "admin";
  const showPreferences = user.role === "superuser" || user.role === "admin";
  const showTemplates = user.role === "superuser" || user.role === "admin";
  const showTactics = hasPermission("view_tactics");
  const showApprovalRequests = user.role === "supervisor";


  // Only show Safety section if user has access to at least one of its sub-items
  const showSafety = showTaskHazard || showRiskAssessment || showApprovalRequests;
  
  // Only show Analytics section if user has access to at least one of its sub-items
  const showAnalyticsSection = showTaskHazard || showRiskAssessment;

  const items: NavItem[] = [
    ...(showAssets ? [{
      title: "Asset Hierarchy",
      href: "/asset-hierarchy",
      icon: CustomIcons.AssetHierarchy,
      iconBg: "bg-[#3498DB]", 
    }] : []),
    ...(showTactics ? [{
      title: "Tactics",
      href: "/tactics",
      icon: CustomIcons.Tactics,
      iconBg: "bg-[#2ECC71]",
    }] : []),
    ...(showSafety ? [{
      title: "Safety",
      href: "/safety",
      icon: CustomIcons.Safety,
      iconBg: "bg-[#2ECC71]",
      subItems: [
        ...(showTaskHazard ? [{ title: "Task Hazard", href: "/safety/task-hazard" }] : []),
        ...(showRiskAssessment ? [{ title: "Risk Assessment", href: "/safety/risk-assessment" }] : []),
        ...(showApprovalRequests ? [{ title: "Approval Requests", href: "/safety/supervisor-dashboard" }] : []),
      ],
    }] : []),
    ...(showAnalyticsSection ? [{
      title: "Analytics",
      href: "/analytics",
      icon: CustomIcons.Analytics,
      iconBg: "bg-[#E67E22]",
      subItems: [
        ...(showTaskHazard ? [{ title: "Task Hazard", href: "/analytics/task-hazard" }] : []),
        ...(showRiskAssessment ? [{ title: "Risk Assessment", href: "/analytics/risk-assessment" }] : []),
      ],
    }] : []),
    ...(showConfigurations ? [{
      title: "Configurations",
      href: "/configurations",
      icon: CustomIcons.Configurations,
      iconBg: "bg-[#E74C3C]", 
      subItems: [
        {
          title: "Admin",
          href: "/configurations/admin",
          subItems: [
            ...(showUsers ? [{ title: "User Management", href: "/configurations/admin/users", description: "Manage all users including regular users and supervisors" }] : []),
            { title: "Data Loader", href: "/configurations/admin/data-loader" },
            ...(showLicenses ? [{ title: "Licensing", href: "/configurations/admin/licensing" }] : []),
          ]
        },
        ...(showPreferences ? [{
          title: "Preferences",
          href: "/configurations/preferences",
          subItems: [
            { title: "Mitigating Action Trigger", href: "/configurations/preferences/mitigating-action-trigger" },
          ]
        }] : []),
        ...(showTemplates ? [{
          title: "Templates",
          href: "/configurations/templates",
          subItems: [
            { title: "Risk Matrix", href: "/configurations/template/risk-matrix" },
            { title: "Mitigating Action Type", href: "/configurations/template/mitigating-action-type" },
            { title: "General Risks", href: "/configurations/template/general-risks" },
          ]
        }] : []),
      ],
    }] : []),  
  ];

  return items;
};

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    setUser(getCurrentUser())
  }, [])

  const sidebarNavItems = getSidebarNavItems(user);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 bg-[rgb(52,73,94)] h-[100dvh] w-64 hidden lg:block">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    )
  }

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
            <div className={cn(
              "bg-white rounded-lg flex items-center justify-center transition-all duration-300",
              isCollapsed ? "p-1.5" : "p-2"
            )}>
              <Image 
                src="/uts-logo.png" 
                alt="Logo" 
                className={cn(
                  "transition-all duration-300",
                  isCollapsed ? "w-8 h-8" : "w-15 h-15",
                  "justify-center"
                )}
                width={150}
                height={48}
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
                <div key={item.href} className="px-3 mb-2 relative">
                  <div 
                    className={cn(
                      "flex items-center justify-center px-0 py-2.5 text-white rounded-lg cursor-pointer group transition-all duration-200",
                      pathname === item.href && "bg-[#2C3E50] text-white",
                      isCollapsed ? "hover:bg-[#223142] w-10 h-10 mx-auto" : "justify-between px-3 hover:bg-[#2C3E50]"
                    )}
                    onClick={() => handleMenuClick(item)}
                    onMouseEnter={() => isCollapsed && setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div className={cn(
                      "flex items-center justify-center",
                      isCollapsed ? "w-10 h-10" : "gap-3"
                    )}>
                      {item.icon && (
                        <div>
                          <item.icon className="h-8 w-8 text-white mx-auto" />
                        </div>
                      )}
                      {!isCollapsed && <span className="text-sm text-white ml-3">{item.title}</span>}
                    </div>
                    {!isCollapsed && item.subItems && (
                      <ChevronRight 
                        className={cn(
                          "h-4 w-4 transition-transform text-white",
                          expandedMenus.includes(item.href) && "transform rotate-90"
                        )}
                      />
                    )}
                    {/* Tooltip for collapsed sidebar */}
                    {isCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[9999] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 opacity-0 transition-opacity duration-200">
                        <div className="bg-[#1B2631] text-white px-3 py-2 rounded shadow-lg text-sm whitespace-nowrap border border-[#2C3E50]">
                          {item.title}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Tooltip for collapsed submenus */}
                  {isCollapsed && item.subItems && hoveredItem === item.href && (
                    <div 
                      className="absolute left-full top-0 ml-2 bg-[#1B2631] border border-[#2C3E50] rounded-lg shadow-xl z-[9999] min-w-[220px]"
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="p-3">
                        <div className="text-white font-medium text-sm mb-3 border-b border-[#2C3E50] pb-2">{item.title}</div>
                        <div className="space-y-1">
                          {item.subItems.map((subItem) => (
                            <div key={subItem.href}>
                              <div 
                                className={cn(
                                  "px-3 py-2 text-white/90 hover:bg-[#2C3E50] hover:text-white rounded-lg cursor-pointer text-sm transition-colors",
                                  pathname === subItem.href && "bg-[#2C3E50] text-white"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(subItem.href);
                                  setHoveredItem(null);
                                }}
                              >
                                {subItem.title}
                              </div>
                              {subItem.subItems && (
                                <div className="ml-3 space-y-1 mt-1">
                                  {subItem.subItems.map((nestedItem) => (
                                    <div
                                      key={nestedItem.href}
                                      className={cn(
                                        "px-3 py-1.5 text-white/80 hover:bg-[#2C3E50] hover:text-white rounded cursor-pointer text-xs transition-colors",
                                        pathname === nestedItem.href && "bg-[#2C3E50] text-white"
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(nestedItem.href);
                                        setHoveredItem(null);
                                      }}
                                    >
                                      {nestedItem.title}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
                  <div className="bg-white p-2 rounded-lg flex items-center justify-center">
                    <Image 
                      src="/uts-logo.png" 
                      alt="Logo" 
                      className="w-12 h-12"
                      width={48}
                      height={48}
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