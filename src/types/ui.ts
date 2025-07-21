
// Navigation item interface
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  requiredPermission?: string;
  subItems?: NavItem[];
  iconBg?: string;
  description?: string;
}

// Dashboard item interface
export interface DashboardItem {
  title: string;
  description: string;
  icon: string;
  href: string;
  permission: string;
  color?: string;
}
  
// Quick action interface
export interface QuickAction {
  title: string;
  description: string;
  href: string;
  permission: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  descriptionColor: string;
}