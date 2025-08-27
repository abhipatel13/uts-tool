"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu, X, Settings, CreditCard, Crown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getCurrentUser } from "@/utils/auth";
import { Permissions, getPermissionsForRole } from "@/config/permissions";
import { NavItem, User } from "@/types";

// Simple icon components
export const Icons = {
  AssetHierarchy: () => (
    <Image src="/asset-hierarchy.png" alt="Asset Hierarchy" width={128} height={128} className="w-10 h-10" priority />
  ),
  Safety: () => (
    <Image src="/safety-hat.png" alt="Safety" width={128} height={128} className="w-10 h-10" priority />
  ),
  Analytics: () => (
    <Image src="/analytics.png" alt="Analytics" width={128} height={128} className="w-10 h-10" priority />
  ),
  Configurations: () => (
    <Image src="/configurations.png" alt="Configurations" width={128} height={128} className="w-10 h-10" priority />
  ),
  Tactics: () => (
    <div className="p-2 rounded-full flex items-center justify-center bg-[#E74C3C]">
      <Settings className="w-6 h-6 text-white" />
    </div>
  ),
  Payments: () => (
    <div className="p-2 rounded-full flex items-center justify-center bg-[#9B59B6]">
      <CreditCard className="w-6 h-6 text-white" />
    </div>
  ),
  UniversalDashboard: () => (
    <div className="p-2 rounded-full flex items-center justify-center bg-[#E74C3C]">
      <Crown className="w-6 h-6 text-white" />
    </div>
  ),
}; 

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  // Get navigation items based on user permissions
  const navigationItems = useMemo(() => {
    if (!user) return [];
    
    const permissions = getPermissionsForRole(user.role);
    const hasPermission = (permission: string) => permissions.includes(permission);
    
    const items: NavItem[] = [];

    // For universal users, show the same structure but with universal access
    const isUniversalUser = user.role === 'universal_user';

    // Universal Portal (for universal users) - FIRST
    if (isUniversalUser) {
      items.push({
        title: "Universal Portal",
        href: "/universal-portal",
        icon: Icons.UniversalDashboard,
      });
    }

    // Asset Hierarchy
    if (hasPermission(Permissions.VIEW_ASSET_HIERARCHY) || hasPermission(Permissions.CREATE_ASSET_HIERARCHY) || isUniversalUser) {
      items.push({
        title: "Asset Hierarchy",
        href: isUniversalUser ? "/universal-portal/asset-hierarchy" : "/asset-hierarchy",
        icon: Icons.AssetHierarchy,
      });
    }

    // Tactics
    if (hasPermission(Permissions.TACTICS) || isUniversalUser) {
      items.push({
        title: "Tactics",
        href: isUniversalUser ? "/universal-portal/tactics" : "/tactics",
        icon: Icons.Tactics,
      });
    }

    // Safety
    const safetyItems: NavItem[] = [];
    if (hasPermission(Permissions.TASK_HAZARD) || isUniversalUser) {
      safetyItems.push({ 
        title: "Task Hazard", 
        href: isUniversalUser ? "/universal-portal/task-hazard" : "/safety/task-hazard" 
      });
    }
    if (hasPermission(Permissions.RISK_ASSESSMENT) || isUniversalUser) {
      safetyItems.push({ 
        title: "Risk Assessment", 
        href: isUniversalUser ? "/universal-portal/risk-assessment" : "/safety/risk-assessment" 
      });
    }
    if (hasPermission(Permissions.SUPERVISOR_APPROVAL) && !isUniversalUser) {
      safetyItems.push({ 
        title: "Approval Requests", 
        href: "/safety/supervisor-dashboard" 
      });
    }
    
    if (safetyItems.length > 0) {
      items.push({
        title: "Safety",
        href: "/safety",
        icon: Icons.Safety,
        subItems: safetyItems,
      });
    }

    // Analytics
    if (hasPermission(Permissions.VIEW_ANALYTICS) || isUniversalUser) {
      const analyticsItems: NavItem[] = [];
      if (hasPermission(Permissions.TASK_HAZARD) || isUniversalUser) {
        analyticsItems.push({ 
          title: "Task Hazard", 
          href: isUniversalUser ? "/universal-portal/analytics/task-hazard" : "/analytics/task-hazard" 
        });
      }
      if (hasPermission(Permissions.RISK_ASSESSMENT) || isUniversalUser) {
        analyticsItems.push({ 
          title: "Risk Assessment", 
          href: isUniversalUser ? "/universal-portal/analytics/risk-assessment" : "/analytics/risk-assessment" 
        });
      }
      
      items.push({
        title: "Analytics",
        href: isUniversalUser ? "/universal-portal/analytics" : "/analytics",
        icon: Icons.Analytics,
        subItems: analyticsItems,
      });
    }



    // Configurations (only for non-universal users)
    if (hasPermission(Permissions.CONFIGURATION_MANAGEMENT) && !isUniversalUser) {
      const adminItems: NavItem[] = [];
      if (hasPermission(Permissions.USER_MANAGEMENT)) {
        adminItems.push({ 
          title: "User Management", 
          href: "/configurations/admin/users" 
        });
      }
      adminItems.push({ title: "Data Loader", href: "/configurations/admin/data-loader" });
      if (hasPermission(Permissions.LICENSING_MANAGEMENT)) {
        adminItems.push({ title: "Licensing", href: "/configurations/admin/licensing" });
      }

      const configItems: NavItem[] = [
        { title: "Admin", href: "/configurations/admin", subItems: adminItems }
      ];

      if (hasPermission(Permissions.PREFERENCE_MANAGEMENT)) {
        configItems.push({
          title: "Preferences",
          href: "/configurations/preferences",
          subItems: [{ title: "Mitigating Action Trigger", href: "/configurations/preferences/mitigating-action-trigger" }]
        });
      }

      if (hasPermission(Permissions.TEMPLATE_MANAGEMENT)) {
        configItems.push({
          title: "Templates",
          href: "/configurations/templates",
          subItems: [
            { title: "Risk Matrix", href: "/configurations/template/risk-matrix" },
            { title: "Mitigating Action Type", href: "/configurations/template/mitigating-action-type" },
            { title: "General Risks", href: "/configurations/template/general-risks" }
          ]
        });
      }

      items.push({
        title: "Configurations",
        href: "/configurations",
        icon: Icons.Configurations,
        subItems: configItems,
      });
    }

    return items;
  }, [user]);

  // Auto-expand menus based on current path
  useEffect(() => {
    if (!pathname || !navigationItems.length) return;
    
    const newExpanded = new Set(expandedMenus);
    
    const expandParents = (items: NavItem[]): boolean => {
      for (const item of items) {
        if (item.href === pathname) {
          return true;
        }
        if (item.subItems) {
          if (expandParents(item.subItems)) {
            newExpanded.add(item.href);
            return true;
          }
        }
      }
      return false;
    };
    
    expandParents(navigationItems);
    setExpandedMenus(newExpanded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navigationItems]);

  // Initialize
  useEffect(() => {
    setMounted(true);
    setUser(getCurrentUser());
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 bg-[rgb(52,73,94)] h-[100dvh] w-64 hidden lg:block">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  const toggleMenu = (href: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedMenus(newExpanded);
  };

  const handleItemClick = (item: NavItem) => {
    if (item.subItems) {
      toggleMenu(item.href);
    } else {
      router.push(item.href);
      setIsMobileOpen(false);
    }
  };

  const renderMenuItem = (item: NavItem, level = 0) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedMenus.has(item.href);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.href}>
        <div
          className={cn(
            "flex items-center text-white rounded-lg cursor-pointer group transition-all duration-200",
            isActive && "bg-[#2C3E50] text-white",
            level === 0 && !isCollapsed && "justify-between px-3 py-2.5 hover:bg-[#2C3E50]",
            level === 0 && isCollapsed && "justify-center hover:bg-[#223142] w-10 h-10 mx-auto",
            level === 1 && "px-3 py-2 text-white/90 hover:bg-[#2C3E50] hover:text-white text-sm",
            level === 2 && "px-3 py-2 text-white/80 hover:bg-[#2C3E50] hover:text-white text-sm"
          )}
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => isCollapsed && level === 0 && setHoveredItem(item.href)}
          onMouseLeave={() => isCollapsed && level === 0 && setHoveredItem(null)}
        >
          <div className={cn("flex items-center", isCollapsed && level === 0 ? "justify-center w-10 h-10" : "gap-3")}>
            {item.icon && level === 0 && <item.icon />}
            {(!isCollapsed || level > 0) && (
              <span className={cn(level === 0 && !isCollapsed && "ml-3")}>
                {item.title}
              </span>
            )}
          </div>

          {(!isCollapsed || level > 0) && hasSubItems && (
            <ChevronRight
              className={cn(
                "transition-transform text-white",
                level === 0 ? "h-4 w-4" : "h-3 w-3",
                level > 0 && "text-white/90",
                isExpanded && "transform rotate-90"
              )}
            />
          )}

          {/* Tooltip for collapsed sidebar */}
          {isCollapsed && level === 0 && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[9999] pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 opacity-0 transition-opacity duration-200">
              <div className="bg-[#1B2631] text-white px-3 py-2 rounded shadow-lg text-sm whitespace-nowrap border border-[#2C3E50]">
                {item.title}
              </div>
            </div>
          )}
        </div>

        {/* Render sub-items */}
        {hasSubItems && isExpanded && (!isCollapsed || level > 0) && (
          <div className={cn("space-y-1", level === 0 ? "mt-1 ml-4" : "mt-1 ml-3")}>
            {item.subItems!.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 bg-[rgb(52,73,94)] h-[100dvh] transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          "hidden lg:block"
        )}
      >
        {/* Logo */}
        <div className={cn("px-6 py-4 flex items-center border-b border-[#2C3E50] shrink-0 bg-[#2C3E50]", isCollapsed ? "justify-center px-2" : "justify-center")}>
          <div
            className={cn(
              "bg-white rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer hover:bg-gray-50",
              isCollapsed ? "p-1.5 w-12 h-12" : "p-2 w-full max-w-[220px] h-20"
            )}
            onClick={() => router.push("/")}
          >
            <Image
              src="/uts-logo.png"
              alt="Logo"
              className={cn("transition-all duration-300 object-contain", isCollapsed ? "w-8 h-8" : "w-full h-full")}
              width={150}
              height={48}
              priority
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 min-h-0 h-[calc(100dvh-4rem)]">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <div className="py-4">
              {navigationItems.map((item) => (
                <div key={item.href} className="px-3 mb-2 relative">
                  {renderMenuItem(item)}
                  
                  {/* Tooltip for collapsed submenus */}
                  {isCollapsed && item.subItems && hoveredItem === item.href && (
                    <div
                      className="absolute left-full top-0 ml-2 bg-[#1B2631] border border-[#2C3E50] rounded-lg shadow-xl z-[9999] min-w-[220px]"
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="p-3">
                        <div className="text-white font-medium text-sm mb-3 border-b border-[#2C3E50] pb-2">
                          {item.title}
                        </div>
                        <div className="space-y-1">
                          {item.subItems!.map((subItem) => (
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collapse Button */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -right-4 z-[9999] bg-white rounded-full p-1 shadow-xl" 
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full border-2 border-black bg-black text-white hover:bg-gray-800 transition-all duration-200"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>



      {/* Main Content */}
      <div className={cn("min-h-[100dvh] transition-all duration-300 bg-gray-50", isCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Main content will be rendered here */}
      </div>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-2 left-2 z-50 lg:hidden text-white bg-[#1B2631] hover:bg-[#2C3E50] border border-[#2C3E50]"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/80" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-[#1B2631]">
            <div className="flex flex-col h-[100dvh]">
              {/* Mobile Logo */}
              <div className="px-6 py-4 flex items-center border-b border-[#2C3E50] shrink-0 bg-[#2C3E50]">
                <div
                  className="bg-white rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer hover:bg-gray-50 w-full max-w-[220px] h-20"
                  onClick={() => {
                    router.push("/");
                    setIsMobileOpen(false);
                  }}
                >
                  <Image
                    src="/uts-logo.png"
                    alt="Logo"
                    className="transition-all duration-300 object-contain w-full h-full"
                    width={150}
                    height={48}
                    priority
                  />
                </div>
              </div>
              
              {/* Mobile Navigation */}
              <div className="flex-1 min-h-0 h-[calc(100dvh-4rem)]">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  <div className="py-4">
                    {navigationItems.map((item) => (
                      <div key={item.href} className="px-3 mb-2">
                        {renderMenuItem(item)}
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
  );
}
