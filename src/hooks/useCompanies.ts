import { useQuery } from '@tanstack/react-query';
import { UniversalUserApi } from '@/services/universalUserApi';

/** Query key for companies */
export const COMPANIES_QUERY_KEY = ['companies'] as const;

interface Company {
  id: number;
  name: string;
  description?: string;
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

