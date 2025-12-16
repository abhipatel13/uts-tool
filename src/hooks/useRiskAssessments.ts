import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { RiskAssessmentApi } from '@/services';
import type { RiskAssessment } from '@/types';

/** Base query key for risk assessments */
export const RISK_ASSESSMENTS_QUERY_KEY = ['riskAssessments'] as const;

interface UseRiskAssessmentsOptions {
  /** Current page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Search term */
  search?: string;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseRiskAssessmentsResult {
  /** Risk assessments for the current page */
  assessments: RiskAssessment[];
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
 * Hook for fetching paginated risk assessments
 * 
 * Features:
 * - Pagination with keepPreviousData for smooth transitions
 * - Search support
 * - Automatic cache invalidation
 * - Background refetching
 */
export function useRiskAssessments(options: UseRiskAssessmentsOptions = {}): UseRiskAssessmentsResult {
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
    queryKey: [...RISK_ASSESSMENTS_QUERY_KEY, { page, limit, search: search.trim() || undefined }],
    queryFn: async () => {
      const response = await RiskAssessmentApi.getRiskAssessmentsMinimal({
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
    assessments: (data?.data ?? []) as RiskAssessment[],
    totalItems: data?.pagination?.totalItems ?? 0,
    totalPages: data?.pagination?.totalPages ?? 1,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
}

interface UseRiskAssessmentOptions {
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for fetching a single risk assessment by ID
 */
export function useRiskAssessment(id: string | null, options: UseRiskAssessmentOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [...RISK_ASSESSMENTS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Assessment ID is required');
      const response = await RiskAssessmentApi.getRiskAssessment(id);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for risk assessment mutations (create, update, delete)
 */
export function useRiskAssessmentMutations() {
  const queryClient = useQueryClient();

  const invalidateRiskAssessments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: RISK_ASSESSMENTS_QUERY_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (assessment: Omit<RiskAssessment, 'id'>) => 
      RiskAssessmentApi.createRiskAssessment(assessment),
    onSuccess: () => invalidateRiskAssessments(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RiskAssessment> }) => 
      RiskAssessmentApi.updateRiskAssessment(id, data),
    onSuccess: () => invalidateRiskAssessments(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => RiskAssessmentApi.deleteRiskAssessment(id),
    onSuccess: () => invalidateRiskAssessments(),
  });

  return {
    createAssessment: createMutation.mutateAsync,
    updateAssessment: updateMutation.mutateAsync,
    deleteAssessment: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    invalidateRiskAssessments,
  };
}

