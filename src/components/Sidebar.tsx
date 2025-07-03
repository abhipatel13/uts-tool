// This file contains navigation items for the sidebar
// These items should be added to your main navigation configuration

export const additionalNavigationItems = [
  {
    title: "Payments",
    href: "/payments/history",
    icon: "credit-card",
    role: "user"
  },
  {
    title: "Payment Management",
    href: "/admin/payments",
    icon: "wallet",
    role: "admin"
  }
];

// Export a default component if needed
export default function Sidebar() {
  return null; // This file is meant for navigation config only
} 