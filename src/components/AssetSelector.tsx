"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AssetHierarchyApi } from "@/services"
import type { Asset } from "@/types"

interface AssetSelectorProps {
  value: string;
  onValueChange: (assetId: string) => void;
  title?: string;
  placeholder?: string;
  error?: string;
}

export function AssetSelector({ value, onValueChange, error, title, placeholder }: AssetSelectorProps) {
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false)
  const assetDropdownRef = useRef<HTMLDivElement>(null)
  const [searchAsset, setSearchAsset] = useState("")
  const [expandedAssets, setExpandedAssets] = useState<string[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(true)
  const [assetError, setAssetError] = useState<string | null>(null)

  // Filter assets based on search term
  const filteredAssets = searchAsset.trim() === "" 
    ? assets 
    : (() => {
        // First, find all assets that directly match the search term
        const directMatches = assets.filter(asset => 
          (asset.name && asset.name.toLowerCase().includes(searchAsset.toLowerCase())) ||
          (asset.description && asset.description.toLowerCase().includes(searchAsset.toLowerCase())) ||
          (asset.id && asset.id.toLowerCase().includes(searchAsset.toLowerCase()))
        );
        
        // Create a set to track which assets should be included
        const assetsToInclude = new Set<string>();
        
        // Add all direct matches
        directMatches.forEach(asset => {
          assetsToInclude.add(asset.id);
          
          // Add all parent assets up the chain so the hierarchy is maintained
          let currentParent: string | null = asset.parent;
          while (currentParent) {
            assetsToInclude.add(currentParent);
            const parentAsset = assets.find(a => a.id === currentParent);
            currentParent = parentAsset?.parent || null;
          }
        });
        
        // Return assets that should be included
        return assets.filter(asset => assetsToInclude.has(asset.id));
      })()

  // Get top-level assets (those with no parent or parent is null)
  const getTopLevelAssets = () => {
    return filteredAssets.filter(asset => asset.parent === null);
  }

  // Get child assets for a given parent ID
  const getChildAssets = (parentId: string) => {
    return filteredAssets.filter(asset => asset.parent === parentId);
  }

  // Toggle expanded state for an asset
  const toggleAssetExpanded = (assetId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedAssets(prev => 
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Check if an asset is expanded
  const isAssetExpanded = (assetId: string) => {
    return expandedAssets.includes(assetId);
  }

  // Highlight matching text in search results
  const highlightMatch = (text: string | undefined, searchTerm: string) => {
    // Handle undefined or null text
    if (!text) return '';
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-200">{part}</span> : part
    );
  };

  // Update the asset system selection handler
  const handleAssetSelection = (assetId: string) => {
    onValueChange(assetId);
    setAssetDropdownOpen(false);
  };

  // Render asset hierarchy recursively
  const renderAssetHierarchy = (assets: Asset[]) => {
    return assets.map(asset => {
      const children = getChildAssets(asset.id)
      const hasChildren = children.length > 0
      const isExpanded = isAssetExpanded(asset.id)
      
      return (
        <div key={asset.id} className="w-full">
          <div 
            className={`flex items-center py-2 px-2 hover:bg-gray-100 cursor-pointer ${value === asset.id ? 'bg-blue-50' : ''}`}
            style={{ paddingLeft: `${asset.level * 16 + 8}px` }}
            onClick={(e) => {
              e.stopPropagation()
              handleAssetSelection(asset.id)
            }}
          >
            {hasChildren && (
              <button
                type="button"
                className="mr-2 text-gray-500 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleAssetExpanded(asset.id, e)
                }}
              >
                {isExpanded ? '▼' : '►'}
              </button>
            )}
            {!hasChildren && <span className="w-4 mr-2"></span>}
            <div className="flex items-center">
              <span className="font-medium min-w-[100px]">
                {highlightMatch(asset.name, searchAsset)}
              </span>
              <span className="ml-2 text-gray-600 text-sm">
                {highlightMatch(asset.description, searchAsset)}
              </span>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="border-l border-gray-200 ml-4">
              {renderAssetHierarchy(children)}
            </div>
          )}
        </div>
      )
    })
  }

  const fetchAssets = async () => {
    try {
      setIsLoadingAssets(true)
      setAssetError(null)
      const response = await AssetHierarchyApi.getAll()
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from server')
      }

      setAssets(response.data)
    } catch (err) {
      console.error('Error fetching assets:', err)
      setAssetError('Failed to load assets. Please try again later.')
    } finally {
      setIsLoadingAssets(false)
    }
  }

  // Fetch assets when component mounts
  useEffect(() => {
    fetchAssets()
  }, [])

  // Expand parent assets when value is set (for edit mode)
  useEffect(() => {
    if (value && assets.length > 0) {
      const expandParentAssets = (assetId: string) => {
        const currentAsset = assets.find(a => a.id === assetId);
        if (!currentAsset) return;
        
        const parentIds: string[] = [];
        let currentParent = currentAsset.parent;
        
        while (currentParent) {
          parentIds.push(currentParent);
          const parentAsset = assets.find(a => a.id === currentParent);
          currentParent = parentAsset?.parent || null;
        }
        
        if (parentIds.length > 0) {
          setExpandedAssets(prev => {
            const newExpanded = [...prev];
            parentIds.forEach(id => {
              if (!newExpanded.includes(id)) {
                newExpanded.push(id);
              }
            });
            return newExpanded;
          });
        }
      };

      expandParentAssets(value);
    }
  }, [value, assets]);

  // Expand parent assets that have matching children when searching
  useEffect(() => {
    if (searchAsset.trim() !== "" && assets.length > 0) {
      // Find all matching assets
      const matchingAssets = assets.filter(asset => 
        (asset.name && asset.name.toLowerCase().includes(searchAsset.toLowerCase())) ||
        (asset.description && asset.description.toLowerCase().includes(searchAsset.toLowerCase())) ||
        (asset.id && asset.id.toLowerCase().includes(searchAsset.toLowerCase()))
      );
      
      const parentsWithMatchingChildren = new Set<string>();
      
      // For each matching asset, if it has a parent, mark that parent for expansion
      matchingAssets.forEach(asset => {
        if (asset.parent) {
          // Add immediate parent
          parentsWithMatchingChildren.add(asset.parent);
          
          // Add all ancestor parents up the chain
          let currentParent: string | null = asset.parent;
          while (currentParent) {
            const parentAsset = assets.find(a => a.id === currentParent);
            if (parentAsset && parentAsset.parent) {
              parentsWithMatchingChildren.add(parentAsset.parent!);
            }
            currentParent = parentAsset?.parent || null;
          }
        }
      });
      
      // Only expand parents that have matching children/descendants
      setExpandedAssets(Array.from(parentsWithMatchingChildren));
    } else {
      // Reset expanded assets when search is cleared
      setExpandedAssets([]);
    }
  }, [searchAsset, assets]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assetDropdownRef.current && !assetDropdownRef.current.contains(event.target as Node)) {
        setAssetDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="assetSystem">{title || 'Asset or System being worked on'}</Label>
      <div className="relative" ref={assetDropdownRef}>
        <div 
          className={`flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 h-10 text-sm ${error ? "border-red-500" : ""}`}
          onClick={() => setAssetDropdownOpen(!assetDropdownOpen)}
        >
          {value ? (
            <div className="flex items-center">
              <span className="font-medium">
                {assets.find(a => a.id === value)?.name || 'Unknown Asset'}
              </span>
              <span className="ml-2 text-muted-foreground">
                {assets.find(a => a.id === value)?.description || ''}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder || 'Select asset or system'}</span>
          )}
          <span className="text-gray-500">{assetDropdownOpen ? '▲' : '▼'}</span>
        </div>
        {error && (
          <span className="text-red-500 text-xs">{error}</span>
        )}
        
        {assetDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            <div className="p-2 pb-0">
              <Input
                placeholder="Search assets..."
                value={searchAsset}
                onChange={(e) => setSearchAsset(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {isLoadingAssets ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Loading assets...
                </div>
              ) : assetError ? (
                <div className="p-2 text-sm text-red-500 text-center">
                  {assetError}
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No assets found
                </div>
              ) : (
                <div className="asset-hierarchy">
                  {renderAssetHierarchy(getTopLevelAssets())}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 