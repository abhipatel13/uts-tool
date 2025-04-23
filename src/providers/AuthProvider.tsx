'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  
  const logout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  if (status === 'loading') {
    return null; 
  }

  const user: AuthUser | null = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ user, logout }}>
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