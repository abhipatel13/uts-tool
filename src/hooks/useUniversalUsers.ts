import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { 
  UniversalUserApi, 
  CreateUniversalUserRequest, 
  UpdateUniversalUserRequest 
} from '@/services/universalUserApi';
import type { User } from '@/types';

/** Base query key for universal users */
export const UNIVERSAL_USERS_QUERY_KEY = ['universalUsers'] as const;

interface UseUniversalUsersOptions {
  /** Current page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Filter by company ID */
  companyId?: number;
  /** Filter by role */
  role?: string;
  /** Search term */
  search?: string;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseUniversalUsersResult {
  /** Users for the current query */
  users: User[];
  /** Total number of users */
  totalUsers: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page */
  currentPage: number;
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Whether any fetch is in progress (including background) */
  isFetching: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Manually refetch data */
  refetch: () => void;
}

/**
 * Hook for fetching universal users (cross-company)
 * 
 * This hook is specifically for the Universal Portal and should only
 * be used by universal_user role accounts.
 * 
 * Features:
 * - Pagination with keepPreviousData for smooth transitions
 * - Company and role filtering
 * - Search support
 * - Automatic cache management
 */
export function useUniversalUsers(options: UseUniversalUsersOptions = {}): UseUniversalUsersResult {
  const {
    page = 1,
    limit = 100,
    companyId,
    role,
    search,
    enabled = true,
  } = options;

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      ...UNIVERSAL_USERS_QUERY_KEY, 
      { page, limit, companyId, role, search: search?.trim() || undefined }
    ],
    queryFn: async () => {
      const response = await UniversalUserApi.getAllUsers({
        page,
        limit,
        company_id: companyId,
        role,
        search: search?.trim() || undefined,
      });
      if (!response.status) {
        throw new Error('Failed to fetch users');
      }
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 seconds
    enabled,
  });

  return {
    users: data?.users ?? [],
    totalUsers: data?.pagination?.totalUsers ?? 0,
    totalPages: data?.pagination?.totalPages ?? 1,
    currentPage: data?.pagination?.currentPage ?? 1,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook for universal user mutations (create, update, delete, reset password)
 * 
 * Automatically invalidates the universal users cache on success,
 * ensuring all components using useUniversalUsers get fresh data.
 */
export function useUniversalUserMutations() {
  const queryClient = useQueryClient();

  const invalidateUniversalUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: UNIVERSAL_USERS_QUERY_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (user: CreateUniversalUserRequest) => 
      UniversalUserApi.createUser(user),
    onSuccess: () => invalidateUniversalUsers(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateUniversalUserRequest }) => 
      UniversalUserApi.updateUser(id, data),
    onSuccess: () => invalidateUniversalUsers(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => UniversalUserApi.deleteUser(id),
    onSuccess: () => invalidateUniversalUsers(),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string | number; newPassword: string }) => 
      UniversalUserApi.resetUserPassword(id, newPassword),
    // No need to invalidate cache for password reset
  });

  const changeOwnPasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => 
      UniversalUserApi.changeOwnPassword(currentPassword, newPassword),
  });

  return {
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    resetUserPassword: resetPasswordMutation.mutateAsync,
    changeOwnPassword: changeOwnPasswordMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isChangingPassword: changeOwnPasswordMutation.isPending,
    invalidateUniversalUsers,
  };
}



