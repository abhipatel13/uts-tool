import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { UniversalUserApi, CreateCompanyRequest } from '@/services/universalUserApi';

/** Query key for companies */
export const COMPANIES_QUERY_KEY = ['companies'] as const;

interface Company {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseCompaniesOptions {
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseCompaniesResult {
  /** All companies */
  companies: Company[];
  /** Whether the query is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Manually refetch companies */
  refetch: () => void;
  /** Find a company by ID */
  findCompany: (companyId: number) => Company | undefined;
}

/**
 * Hook for fetching and caching company data
 * 
 * Features:
 * - Shared cache across all components using this hook
 * - 5-minute stale time (companies don't change often)
 * - Automatic refetch on window focus
 */
export function useCompanies(options: UseCompaniesOptions = {}): UseCompaniesResult {
  const { enabled = true } = options;

  const {
    data: companies = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: async () => {
      const response = await UniversalUserApi.getAllCompanies();
      if (!response.status) {
        throw new Error('Failed to fetch companies');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    enabled,
  });

  // Helper to find a company by ID
  const findCompany = (companyId: number) => {
    return companies.find(c => c.id === companyId);
  };

  return {
    companies,
    isLoading,
    error: error as Error | null,
    refetch,
    findCompany,
  };
}

/**
 * Hook for company mutations (create, update, delete)
 * 
 * Automatically invalidates the companies cache on success,
 * ensuring all components using useCompanies get fresh data.
 */
export function useCompanyMutations() {
  const queryClient = useQueryClient();

  const invalidateCompanies = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (company: CreateCompanyRequest) => 
      UniversalUserApi.createCompany(company),
    onSuccess: () => invalidateCompanies(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCompanyRequest> }) => 
      UniversalUserApi.updateCompany(id, data),
    onSuccess: () => invalidateCompanies(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => UniversalUserApi.deleteCompany(id),
    onSuccess: () => invalidateCompanies(),
  });

  return {
    createCompany: createMutation.mutateAsync,
    updateCompany: updateMutation.mutateAsync,
    deleteCompany: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    invalidateCompanies,
  };
}

