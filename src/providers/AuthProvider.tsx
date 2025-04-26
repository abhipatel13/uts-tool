'use client';

import { createContext, useContext, ReactNode, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import React from 'react';

interface AuthUser {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  accessToken?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLogoutAttemptRef = useRef<number>(0);
  
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

      await signOut({ callbackUrl: '/auth/login' });
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

  if (status === 'loading') {
    return null;
  }

  const user: AuthUser | null = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ user, logout, isLoggingOut }}>
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