'use client';

import { createContext, useContext, ReactNode, useState, useRef, useEffect } from 'react';
import { getCurrentUser, logout as authLogout } from '@/utils/auth';
import React from 'react';

interface AuthUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  company?: string;
  permissions?: string[];
  isAuthenticated?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLogoutAttemptRef = useRef<number>(0);

  // Load user from localStorage on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);
  
  const logout = async () => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastLogoutAttemptRef.current;
    
    // Prevent rapid repeated calls (debounce of 2 seconds)
    if (isLoggingOut || timeSinceLastAttempt < 2000) {
      return;
    }

    try {
      setIsLoggingOut(true);
      lastLogoutAttemptRef.current = now;
      
      // Clear any existing timeout
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }

      await authLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Ensure isLoggingOut is reset after a maximum of 5 seconds
      logoutTimeoutRef.current = setTimeout(() => {
        setIsLoggingOut(false);
      }, 5000);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, logout, isLoggingOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 