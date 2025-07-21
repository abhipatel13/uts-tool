/**
 * Centralized role and permission configuration
 * This file consolidates all role-based access control logic
 */

// User roles enum
export enum UserRole {
  SUPER_USER = "superuser",
  ADMIN = "admin",
  SUPERVISOR = "supervisor",
  USER = "user",
}

// Individual permissions - centralized definition
export const Permissions = {
  // Account permissions
  USER_MANAGEMENT: "user_management",

  // Asset permissions
  CREATE_ASSET_HIERARCHY: "create_asset_hierarchy",
  VIEW_ASSET_HIERARCHY: "view_asset_hierarchy",
  ASSET_BULK_UPLOAD: "asset_bulk_upload",

  // Safety permissions
  RISK_ASSESSMENT: "risk_assessment",
  TASK_HAZARD: "task_hazard",
  SUPERVISOR_APPROVAL: "supervisor_approval",

  // Analytics permissions
  VIEW_ANALYTICS: "view_analytics",

  // License permissions
  LICENSING_MANAGEMENT: "licensing_management",

  // Configuration permissions
  CONFIGURATION_MANAGEMENT: "configuration_management",
  PREFERENCE_MANAGEMENT: "preference_management",
  TEMPLATE_MANAGEMENT: "template_management",

  // Tactics permissions
  TACTICS: "tactics",
  CREATE_TACTICS: "create_tactics",
} as const;

// Simple role-based permission mapping - direct assignment
export const RolePermissions: Record<string, string[]> = {
  [UserRole.SUPER_USER]: Object.values(Permissions), // Superuser has all permissions

  [UserRole.ADMIN]: Object.values(Permissions), // Admin has all permissions

  [UserRole.SUPERVISOR]: [
    // Asset permissions
    Permissions.VIEW_ASSET_HIERARCHY,

    // Safety permissions
    Permissions.RISK_ASSESSMENT,
    Permissions.TASK_HAZARD,
    Permissions.SUPERVISOR_APPROVAL,

    // Analytics permissions
    Permissions.VIEW_ANALYTICS,
  ],

  [UserRole.USER]: [
    Permissions.VIEW_ASSET_HIERARCHY,
    Permissions.TASK_HAZARD,
  ],
};

// Helper function to check if a user has a specific permission
export function hasPermission(
  userRole: string | undefined,
  permission: string
): boolean {
  if (!userRole) return false;

  // Get user permissions from role mapping
  const userPermissions = getPermissionsForRole(userRole);
  return userPermissions.includes(permission);
}

// Helper function to get permissions for a specific role
export function getPermissionsForRole(role: string): string[] {
  return RolePermissions[role] || [];
}

// Helper function to get color scheme based on role
export function getRoleColorScheme(role: string): {
  primary: string;
  secondary: string;
} {
  switch (role) {
    case UserRole.SUPER_USER:
      return { primary: "purple", secondary: "purple" };
    case UserRole.ADMIN:
      return { primary: "blue", secondary: "blue" };
    case UserRole.SUPERVISOR:
      return { primary: "green", secondary: "green" };
    case UserRole.USER:
    default:
      return { primary: "gray", secondary: "gray" };
  }
}

// Helper function to get role icon
export function getRoleIcon(role: string): string {
  switch (role) {
    case UserRole.SUPER_USER:
      return "shield";
    case UserRole.ADMIN:
      return "users";
    case UserRole.SUPERVISOR:
      return "file-text";
    case UserRole.USER:
    default:
      return "user";
  }
}

// Helper function to get display title for a role
export function getRoleTitle(role: string): string {
  switch (role) {
    case UserRole.SUPER_USER:
      return "Superuser";
    case UserRole.ADMIN:
      return "Administrator";
    case UserRole.SUPERVISOR:
      return "Supervisor";
    case UserRole.USER:
    default:
      return "User";
  }
}


