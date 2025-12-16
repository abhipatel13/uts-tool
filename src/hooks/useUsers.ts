import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { UserApi } from '@/services';
import type { User } from '@/types';

/** Query key for users */
export const USERS_QUERY_KEY = ['users'] as const;

interface UseUsersOptions {
  /** Filter users by specific roles */
  roleFilter?: string[];
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseUsersResult {
  /** All users (filtered by role if specified) */
  users: User[];
  /** Whether the query is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Manually refetch users */
  refetch: () => void;
}

/**
 * Hook for fetching and caching user data
 * 
 * Features:
 * - Shared cache across all components using this hook
 * - 5-minute stale time (users don't change often)
 * - Optional role filtering
 * - Automatic refetch on window focus
 */
export function useUsers(options: UseUsersOptions = {}): UseUsersResult {
  const { roleFilter, enabled = true } = options;

  const {
    data: allUsers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const response = await UserApi.getAllRestricted();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - users don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    enabled,
  });

  // Apply role filter if specified (done client-side to share cache)
  const users = useMemo(() => {
    if (!roleFilter || roleFilter.length === 0) {
      return allUsers;
    }
    return allUsers.filter(user => roleFilter.includes(user.role));
  }, [allUsers, roleFilter]);

  return {
    users,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

