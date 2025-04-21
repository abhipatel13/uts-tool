import { getCurrentUser, hasPermission } from "./auth"

interface DashboardItem {
  title: string;
  description: string;
  icon: string;
  href: string;
  permission: string;
}

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

  // Superuser or Admin has access to all features
  if (user.role === "superuser" || user.role === "admin") return true

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
export function getDashboardItems(): DashboardItem[] {
  const user = getCurrentUser();
  if (!user) return [];

  // Define all possible dashboard items
  const allItems: DashboardItem[] = [
    {
      title: "Asset Hierarchy",
      description: "Manage and view your asset hierarchy structure",
      icon: "Building2",
      href: "/asset-hierarchy",
      permission: "asset_hierarchy"
    },
    {
      title: "Task Hazard",
      description: "Create and manage task hazard assessments",
      icon: "AlertTriangle",
      href: "/safety/task-hazard",
      permission: "task_hazard_management"
    },
    {
      title: "Risk Assessment",
      description: "Create and manage risk assessments",
      icon: "Shield",
      href: "/safety/risk-assessment",
      permission: "risk_assessment_creation"
    },
    {
      title: "Analytics",
      description: "View analytics and reports",
      icon: "BarChart3",
      href: "/analytics",
      permission: "analytics_reporting"
    },
    {
      title: "Configuration",
      description: "Manage system configurations",
      icon: "Settings",
      href: "/configurations",
      permission: "configuration_management"
    }
  ];

  // Filter items based on user role
  if (user.role === "superuser" || user.role === "admin") { // Grant admin same access as superuser
    return allItems;
  }

  if (user.role === "supervisor") {
    return allItems.filter(item => 
      item.permission === "task_hazard_management" ||
      item.permission === "risk_assessment_creation" ||
      item.permission === "analytics_reporting"
    );
  }

  // Regular user - only show risk assessment creation
  return allItems.filter(item => 
    item.permission === "risk_assessment_creation"
  );
} 