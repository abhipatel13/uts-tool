// Get the current user from localStorage
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Check if user has a specific role
export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Superuser has all roles
  if (user.role === 'superuser') return true;
  
  return user.role === role;
};

// Check if user has a specific permission
export const hasPermission = (permission: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Superuser has all permissions
  if (user.role === 'superuser') return true;
  
  // Check if user has the permission
  return user.permissions && user.permissions.includes(permission);
};

// Get all permissions for the current user
export const getUserPermissions = (): string[] => {
  const user = getCurrentUser();
  if (!user) return [];
  
  // Return the permissions from the user object
  return user.permissions || [];
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const user = getCurrentUser();
  const token = getAuthToken();
  return !!user && !!token && !!user.isAuthenticated;
};

// Get auth token for API requests
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Set auth token for API requests
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
};

// Define user interface
interface User {
  id: string;
  email: string;
  role: string;
  company?: string;
  permissions?: string[];
  isAuthenticated: boolean;
  [key: string]: string | boolean | string[] | undefined; // More specific index signature
}

// Set user data
export const setUserData = (userData: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(userData));
};

// Logout user
export const logout = async () => {
  try {
    // Get the token from localStorage
    const token = getAuthToken()
    
    if (token) {
      // Call the logout API endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Clear all auth data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // Clear any other stored data
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = '/auth/login';
  }
}; 