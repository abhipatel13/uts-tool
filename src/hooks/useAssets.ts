import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AssetHierarchyApi } from '@/services';
import type { Asset } from '@/types';

/** Query key for assets */
export const ASSETS_QUERY_KEY = ['assets'] as const;

/** Stable empty array to prevent infinite re-renders when data is loading */
const EMPTY_ASSETS: Asset[] = [];

interface UseAssetsOptions {
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
}

interface UseAssetsResult {
  /** All assets */
  assets: Asset[];
  /** Whether the query is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Manually refetch assets */
  refetch: () => void;
  /** Get top-level assets (no parent) */
  getTopLevelAssets: () => Asset[];
  /** Get child assets for a given parent ID (uses internal ID) */
  getChildAssets: (parentId: string) => Asset[];
  /** Find an asset by internal ID (UUID) - use for API calls */
  findAsset: (assetId: string) => Asset | undefined;
  /** Find an asset by external ID (user-provided) - use for display/search */
  findAssetByExternalId: (externalId: string) => Asset | undefined;
}

/**
 * Hook for fetching and caching asset hierarchy data
 * 
 * Features:
 * - Shared cache across all components using this hook
 * - 5-minute stale time (assets don't change often)
 * - Helper functions for tree navigation
 * - Automatic refetch on window focus
 */
export function useAssets(options: UseAssetsOptions = {}): UseAssetsResult {
  const { enabled = true } = options;

  const {
    data: assets = EMPTY_ASSETS,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ASSETS_QUERY_KEY,
    queryFn: async () => {
      const response = await AssetHierarchyApi.getAll();
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    enabled,
  });

  // Helper to get top-level assets
  const getTopLevelAssets = useMemo(() => {
    return () => assets.filter(asset => asset.parent === null);
  }, [assets]);

  // Helper to get children of a parent
  const getChildAssets = useMemo(() => {
    return (parentId: string) => assets.filter(asset => asset.parent === parentId);
  }, [assets]);

  // Helper to find an asset by internal ID (UUID)
  const findAsset = useMemo(() => {
    return (assetId: string) => assets.find(asset => asset.id === assetId);
  }, [assets]);

  // Helper to find an asset by external ID (user-provided)
  const findAssetByExternalId = useMemo(() => {
    return (externalId: string) => assets.find(asset => asset.externalId === externalId);
  }, [assets]);

  return {
    assets,
    isLoading,
    error: error as Error | null,
    refetch,
    getTopLevelAssets,
    getChildAssets,
    findAsset,
    findAssetByExternalId,
  };
}

