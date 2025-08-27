import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { User, ApiResponse } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true
  });

  useEffect(() => {
    // Fetch user data from your authentication endpoint
    const fetchUser = async () => {
      try {
        const userData = await api.get<ApiResponse<User>>('/api/auth/user');
        setAuthState({ user: userData.data, loading: false });
      } catch (error) {
        console.error('Error fetching user:', error);
        setAuthState({ user: null, loading: false });
      }
    };

    fetchUser();
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    isAuthenticated: !!authState.user
  };
} 