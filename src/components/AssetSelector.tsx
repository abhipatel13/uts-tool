"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Asset } from "@/types"
import { useAssets } from "@/hooks/useAssets"

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

  // Use the shared assets hook
  const { assets, isLoading: isLoadingAssets, error: assetError } = useAssets()

  // Filter assets based on search term
  const filteredAssets = useMemo(() => {
    if (searchAsset.trim() === "") return assets
    
    // Find all assets that directly match the search term
    const directMatches = assets.filter(asset => 
      (asset.name && asset.name.toLowerCase().includes(searchAsset.toLowerCase())) ||
      (asset.description && asset.description.toLowerCase().includes(searchAsset.toLowerCase())) ||
      (asset.id && asset.id.toLowerCase().includes(searchAsset.toLowerCase())) ||
      (asset.cmmsInternalId && asset.cmmsInternalId.toLowerCase().includes(searchAsset.toLowerCase())) ||
      (asset.functionalLocation && asset.functionalLocation.toLowerCase().includes(searchAsset.toLowerCase()))
    )
    
    // Create a set to track which assets should be included
    const assetsToInclude = new Set<string>()
    
    directMatches.forEach(asset => {
      assetsToInclude.add(asset.id)
      
      // Add all parent assets up the chain
      let currentParent: string | null = asset.parent
      while (currentParent) {
        assetsToInclude.add(currentParent)
        const parentAsset = assets.find(a => a.id === currentParent)
        currentParent = parentAsset?.parent || null
      }
    })
    
    return assets.filter(asset => assetsToInclude.has(asset.id))
  }, [assets, searchAsset])

  // Get top-level assets
  const getTopLevelAssets = () => filteredAssets.filter(asset => asset.parent === null)

  // Get children from filtered assets
  const getFilteredChildAssets = (parentId: string) => 
    filteredAssets.filter(asset => asset.parent === parentId)

  // Toggle expanded state
  const toggleAssetExpanded = (assetId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setExpandedAssets(prev => 
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    )
  }

  const isAssetExpanded = (assetId: string) => expandedAssets.includes(assetId)

  // Highlight matching text
  const highlightMatch = (text: string | undefined, searchTerm: string) => {
    if (!text) return ''
    if (!searchTerm.trim()) return text

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-200">{part}</span> : part
    )
  }

  const handleAssetSelection = (assetId: string) => {
    onValueChange(assetId)
    setAssetDropdownOpen(false)
  }

  // Render asset hierarchy recursively
  const renderAssetHierarchy = (assetList: Asset[]) => {
    return assetList.map(asset => {
      const children = getFilteredChildAssets(asset.id)
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
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <span className="text-black font-mono text-sm font-medium min-w-[120px]">
                  {highlightMatch(asset.id, searchAsset)}
                </span>
              </div>
              <div className="flex items-center flex-1 ml-4">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {highlightMatch(asset.name, searchAsset)}
                  </span>
                  {asset.description && (
                    <span className="text-gray-500 text-xs">
                      {highlightMatch(asset.description, searchAsset)}
                    </span>
                  )}
                </div>
              </div>
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

  // Expand parent assets when value is set (for edit mode)
  useEffect(() => {
    if (value && assets.length > 0) {
      const currentAsset = assets.find(a => a.id === value)
      if (!currentAsset) return
      
      const parentIds: string[] = []
      let currentParent = currentAsset.parent
      
      while (currentParent) {
        parentIds.push(currentParent)
        const parentAsset = assets.find(a => a.id === currentParent)
        currentParent = parentAsset?.parent || null
      }
      
      if (parentIds.length > 0) {
        setExpandedAssets(prev => {
          const newExpanded = [...prev]
          parentIds.forEach(id => {
            if (!newExpanded.includes(id)) newExpanded.push(id)
          })
          return newExpanded
        })
      }
    }
  }, [value, assets])

  // Expand parents with matching children when searching
  useEffect(() => {
    if (searchAsset.trim() !== "" && assets.length > 0) {
      const matchingAssets = assets.filter(asset => 
        (asset.name && asset.name.toLowerCase().includes(searchAsset.toLowerCase())) ||
        (asset.description && asset.description.toLowerCase().includes(searchAsset.toLowerCase())) ||
        (asset.id && asset.id.toLowerCase().includes(searchAsset.toLowerCase())) ||
        (asset.cmmsInternalId && asset.cmmsInternalId.toLowerCase().includes(searchAsset.toLowerCase())) ||
        (asset.functionalLocation && asset.functionalLocation.toLowerCase().includes(searchAsset.toLowerCase()))
      )
      
      const parentsWithMatchingChildren = new Set<string>()
      
      matchingAssets.forEach(asset => {
        if (asset.parent) {
          parentsWithMatchingChildren.add(asset.parent)
          let currentParent: string | null = asset.parent
          while (currentParent) {
            const parentAsset = assets.find(a => a.id === currentParent)
            if (parentAsset?.parent) {
              parentsWithMatchingChildren.add(parentAsset.parent)
            }
            currentParent = parentAsset?.parent || null
          }
        }
      })
      
      setExpandedAssets(Array.from(parentsWithMatchingChildren))
    } else {
      setExpandedAssets([])
    }
  }, [searchAsset, assets])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assetDropdownRef.current && !assetDropdownRef.current.contains(event.target as Node)) {
        setAssetDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedAsset = assets.find(a => a.id === value)

  return (
    <div className="space-y-2">
      <Label htmlFor="assetSystem">{title || 'Asset or System being worked on'}</Label>
      <div className="relative" ref={assetDropdownRef}>
        <div 
          className={`flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 h-10 text-sm ${error ? "border-red-500" : ""}`}
          onClick={() => setAssetDropdownOpen(!assetDropdownOpen)}
        >
          {value && selectedAsset ? (
            <div className="flex items-center justify-between w-full min-h-[40px]">
              <div className="flex items-center">
                <span className="text-black font-mono text-sm font-medium min-w-[120px]">
                  {selectedAsset.id}
                </span>
              </div>
              <div className="flex items-center flex-1 ml-4">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{selectedAsset.name}</span>
                  {selectedAsset.description && (
                    <span className="text-gray-500 text-xs">{selectedAsset.description}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder || 'Select asset or system'}</span>
          )}
          <span className="text-gray-500">{assetDropdownOpen ? '▲' : '▼'}</span>
        </div>
        {error && <span className="text-red-500 text-xs">{error}</span>}
        
        {assetDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            <div className="p-2 pb-0">
              <Input
                placeholder="Search by name, ID, description, or location..."
                value={searchAsset}
                onChange={(e) => setSearchAsset(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {isLoadingAssets ? (
                <div className="p-2 text-sm text-muted-foreground text-center">Loading assets...</div>
              ) : assetError ? (
                <div className="p-2 text-sm text-red-500 text-center">{assetError.message}</div>
              ) : filteredAssets.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">No assets found</div>
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
