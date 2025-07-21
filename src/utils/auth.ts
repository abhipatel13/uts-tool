import { User } from "@/types/user";
import { hasPermission as checkPermission } from "@/config/permissions";

// Get the current user from localStorage
export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

// Check if user has a specific role
export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  // Superuser has all roles
  if (user.role === "superuser") return true;

  return user.role === role;
};

// Check if user has a specific permission - now uses centralized system
export const hasPermission = (permission: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  return checkPermission(user.role, permission);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const user = getCurrentUser();
  const token = getAuthToken();
  return !!user && !!token && !!user.isAuthenticated;
};

// Check if user has an active license (async function) - Always returns true since license validation is disabled
export const hasActiveLicense = async (): Promise<boolean> => {
  return true;
};

// Check if user is fully authorized (authenticated + has license)
export const isFullyAuthorized = async (): Promise<boolean> => {
  if (!isAuthenticated()) return false;
  return await hasActiveLicense();
};

// Get auth token for API requests
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Set auth token for API requests
export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
};

// Set user data
export const setUserData = (userData: User): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(userData));
};

// Constants
const LOGOUT_TIMEOUT_MS = 5000;

// Logout user
export const logout = async () => {
  try {
    // Get the token from localStorage
    const token = getAuthToken();

    if (token) {
      try {
        // Call the logout API endpoint with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          LOGOUT_TIMEOUT_MS
        );

        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (error) {
        // Log the error but continue with cleanup
        console.error("Logout API error:", error);
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Always clear local storage and redirect
    try {
      // Clear all auth data from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Clear any other stored data
      sessionStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }

    // Redirect to login page
    window.location.href = "/auth/login";
  }
};
