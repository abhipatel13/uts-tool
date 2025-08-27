import { getCurrentUser, hasPermission } from "./auth";
import {
  Permissions,
  getRoleColorScheme as getColorScheme,
  getRoleIcon as getIcon,
  getRoleTitle as getTitle,
} from "@/config/permissions";
import { DashboardItem, QuickAction } from "@/types";
import { Icons } from "@/components/layout/sidebar";

// Re-export centralized functions for backward compatibility
export const getRoleColorScheme = () => {
  const user = getCurrentUser();
  if (!user) return { primary: "gray", secondary: "gray" };
  return getColorScheme(user.role);
};

export const getRoleIcon = () => {
  const user = getCurrentUser();
  if (!user) return "user";
  return getIcon(user.role);
};

export const getRoleTitle = () => {
  const user = getCurrentUser();
  if (!user) return "User";
  return getTitle(user.role);
};

// Get role-specific dashboard items - now uses centralized permission system
export function getDashboardItems(): DashboardItem[] {
  const user = getCurrentUser();
  if (!user) return [];

  // Define all possible dashboard items using centralized permissions
  const allItems: DashboardItem[] = [
    {
      title: "Asset Hierarchy",
      description: "Manage and view your asset hierarchy structure",
      icon: Icons.AssetHierarchy,
      href: "/asset-hierarchy",
      permission: Permissions.VIEW_ASSET_HIERARCHY,
    },
    {
      title: "Tactics",
      description: "Manage and configure tactics",
      icon: Icons.Tactics,
      href: "/tactics",
      permission: Permissions.TACTICS,
    },
    {
      title: "Task Hazard",
      description: "Create and manage task hazard assessments",
      icon: Icons.Safety,
      href: "/safety/task-hazard",
      permission: Permissions.TASK_HAZARD,
    },
    {
      title: "Risk Assessment",
      description: "Create and manage risk assessments",
      icon: Icons.Safety,
      href: "/safety/risk-assessment",
      permission: Permissions.RISK_ASSESSMENT,
    },
    {
      title: "Analytics",
      description: "View analytics and reports",
      icon: Icons.Analytics,
      href: "/analytics",
      permission: Permissions.VIEW_ANALYTICS,
    },
    {
      title: "Configuration",
      description: "Manage system configurations",
      icon: Icons.Configurations,
      href: "/configurations",
      permission: Permissions.CONFIGURATION_MANAGEMENT,
    },
  ];

  // Filter items based on user permissions using centralized system
  return allItems.filter((item) => hasPermission(item.permission));
}

// Get quick actions based on user permissions
export function getQuickActions(): QuickAction[] {

  const quickActions: QuickAction[] = [
    {
      title: "Create Task Hazard",
      description: "Start a new assessment",
      href: "/safety/task-hazard",
      permission: Permissions.TASK_HAZARD,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-900",
      descriptionColor: "text-orange-700",
    },
    {
      title: "Risk Assessment",
      description: "Evaluate risks",
      href: "/safety/risk-assessment",
      permission: Permissions.RISK_ASSESSMENT,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-900",
      descriptionColor: "text-blue-700",
    },
    {
      title: "View Assets",
      description: "Browse hierarchy",
      href: "/asset-hierarchy",
      permission: Permissions.VIEW_ASSET_HIERARCHY,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-900",
      descriptionColor: "text-green-700",
    },
    {
      title: "Analytics",
      description: "View reports",
      href: "/analytics",
      permission: Permissions.VIEW_ANALYTICS,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-900",
      descriptionColor: "text-purple-700",
    },
  ];

  // Filter actions based on user permissions - only show what user can access
  return quickActions.filter((action) =>
    hasPermission(action.permission)
  );
}
