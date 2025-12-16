import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AssetHierarchyApi } from '@/services';
import type { Asset } from '@/types';

/** Query key for assets */
export const ASSETS_QUERY_KEY = ['assets'] as const;

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
  /** Get child assets for a given parent ID */
  getChildAssets: (parentId: string) => Asset[];
  /** Find an asset by ID */
  findAsset: (assetId: string) => Asset | undefined;
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
    data: assets = [],
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

  // Helper to find an asset by ID
  const findAsset = useMemo(() => {
    return (assetId: string) => assets.find(asset => asset.id === assetId);
  }, [assets]);

  return {
    assets,
    isLoading,
    error: error as Error | null,
    refetch,
    getTopLevelAssets,
    getChildAssets,
    findAsset,
  };
}

