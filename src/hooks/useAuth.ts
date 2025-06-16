import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  user_type: string;
}

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
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setAuthState({ user: userData, loading: false });
        } else {
          setAuthState({ user: null, loading: false });
        }
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