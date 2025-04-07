import { getCurrentUser, hasPermission } from "./auth"

// Get role-specific color scheme
export const getRoleColorScheme = () => {
  const user = getCurrentUser()
  if (!user) return { primary: "gray", secondary: "gray" }

  switch (user.role) {
    case "superuser":
      return { primary: "purple", secondary: "purple" }
    case "admin":
      return { primary: "blue", secondary: "blue" }
    case "supervisor":
      return { primary: "green", secondary: "green" }
    default:
      return { primary: "gray", secondary: "gray" }
  }
}

// Get role-specific icon
export const getRoleIcon = () => {
  const user = getCurrentUser()
  if (!user) return "user"

  switch (user.role) {
    case "superuser":
      return "shield"
    case "admin":
      return "users"
    case "supervisor":
      return "file-text"
    default:
      return "user"
  }
}

// Get role-specific title
export const getRoleTitle = () => {
  const user = getCurrentUser()
  if (!user) return "User"

  switch (user.role) {
    case "superuser":
      return "Superuser"
    case "admin":
      return "Administrator"
    case "supervisor":
      return "Supervisor"
    default:
      return "User"
  }
}

// Check if user has access to a specific feature
export const hasFeatureAccess = (feature: string): boolean => {
  const user = getCurrentUser()
  if (!user) return false

  // Superuser has access to all features
  if (user.role === "superuser") return true

  // Define feature permissions
  const featurePermissions: Record<string, string[]> = {
    users: ["account_creation"],
    licenses: ["licensing_management"],
    assets: ["asset_hierarchy"],
    "risk-assessment": ["risk_assessment"],
    "risk-assessment-creation": ["risk_assessment_creation"],
    safety: ["safety_management"],
    "safety-reporting": ["safety_reporting"],
    analytics: ["analytics_reporting"],
    configuration: ["system_configuration"]
  }

  // Check if user has permission for the feature
  const requiredPermissions = featurePermissions[feature] || []
  return requiredPermissions.some((permission) => hasPermission(permission))
}

// Get role-specific dashboard items
export const getDashboardItems = () => {
  const user = getCurrentUser()
  if (!user) return []

  // Define all possible dashboard items
  const allItems = [
    {
      title: "Users",
      description: "Manage user accounts and permissions",
      icon: "users",
      href: "/admin/users",
      permission: "account_creation",
    },
    {
      title: "Licenses",
      description: "Manage software licenses and subscriptions",
      icon: "shield",
      href: "/admin/licenses",
      permission: "licensing_management",
    },
    {
      title: "Asset Hierarchy",
      description: "Manage asset hierarchy and relationships",
      icon: "database",
      href: "/admin/assets",
      permission: "asset_hierarchy",
    },
    {
      title: "Safety Management",
      description: "Manage safety protocols and incidents",
      icon: "shield",
      href: "/safety",
      permission: "safety_management",
    },
    {
      title: "Safety Reporting",
      description: "Submit and view safety reports",
      icon: "file-text",
      href: "/safety/reporting",
      permission: "safety_reporting",
    },
    {
      title: "Analytics & Reporting",
      description: "View analytics and generate reports",
      icon: "bar-chart",
      href: "/analytics",
      permission: "analytics_reporting",
    },
    {
      title: "System Configuration",
      description: "Configure system settings and parameters",
      icon: "settings",
      href: "/configuration",
      permission: "system_configuration",
    },
    {
      title: "Risk Assessment",
      description: "View and manage risk assessments",
      icon: "file-text",
      href: "/risk-assessment",
      permission: "risk_assessment",
    },
    {
      title: "Create Assessment",
      description: "Create a new risk assessment",
      icon: "file-text",
      href: "/risk-assessment/create",
      permission: "risk_assessment_creation",
    },
  ]

  // Filter items based on user role and permissions
  if (user.role === "superuser") {
    return allItems; // Superuser sees all items
  } else if (user.role === "admin") {
    // Admin only sees account creation, licensing, and asset hierarchy
    return allItems.filter(item => 
      item.permission === "account_creation" || 
      item.permission === "licensing_management" || 
      item.permission === "asset_hierarchy"
    );
  } else if (user.role === "supervisor") {
    // Supervisor sees risk assessment, safety management, and analytics
    return allItems.filter(item => 
      item.permission === "risk_assessment" || 
      item.permission === "safety_management" || 
      item.permission === "analytics_reporting"
    );
  } else {
    // Regular user only sees risk assessment creation
    return allItems.filter(item => 
      item.permission === "risk_assessment_creation"
    );
  }
} 