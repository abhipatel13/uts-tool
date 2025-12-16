import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { TaskHazardApi } from '@/services';
import type { TaskHazard } from '@/types';

/** Base query key for task hazards */
export const TASK_HAZARDS_QUERY_KEY = ['taskHazards'] as const;

interface UseTaskHazardsOptions {
  /** Current page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Search term */
  search?: string;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseTaskHazardsResult {
  /** Task hazards for the current page */
  tasks: Partial<TaskHazard>[];
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
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
 * Hook for fetching paginated task hazards
 * 
 * Features:
 * - Pagination with keepPreviousData for smooth transitions
 * - Search support
 * - Automatic cache invalidation
 * - Background refetching
 */
export function useTaskHazards(options: UseTaskHazardsOptions = {}): UseTaskHazardsResult {
  const {
    page = 1,
    limit = 20,
    search = '',
    enabled = true,
  } = options;

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [...TASK_HAZARDS_QUERY_KEY, { page, limit, search: search.trim() || undefined }],
    queryFn: async () => {
      const response = await TaskHazardApi.getTaskHazards({
        page,
        limit,
        search: search.trim() || undefined,
      });
      return response;
    },
    placeholderData: keepPreviousData, // Keep previous data while fetching new page
    staleTime: 30 * 1000, // 30 seconds
    enabled,
  });

  return {
    tasks: data?.data ?? [],
    totalItems: data?.pagination?.totalItems ?? 0,
    totalPages: data?.pagination?.totalPages ?? 1,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
}

interface UseTaskHazardOptions {
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for fetching a single task hazard by ID
 */
export function useTaskHazard(id: string | null, options: UseTaskHazardOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [...TASK_HAZARDS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Task ID is required');
      const response = await TaskHazardApi.getTaskHazard(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for task hazard mutations (create, update, delete)
 */
export function useTaskHazardMutations() {
  const queryClient = useQueryClient();

  const invalidateTaskHazards = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: TASK_HAZARDS_QUERY_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (task: Omit<TaskHazard, 'id'>) => TaskHazardApi.createTaskHazard(task),
    onSuccess: () => invalidateTaskHazards(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskHazard> }) => 
      TaskHazardApi.updateTaskHazard(id, data),
    onSuccess: () => invalidateTaskHazards(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TaskHazardApi.deleteTaskHazard(id),
    onSuccess: () => invalidateTaskHazards(),
  });

  return {
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    invalidateTaskHazards,
  };
}

