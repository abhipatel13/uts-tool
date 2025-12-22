"use client"

import { useState, useCallback } from "react"
import dynamic from 'next/dynamic'

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Base type for map data items
interface MapDataItem {
  id?: string | number;
  location?: string;
  [key: string]: unknown;
}

// Dynamic import to avoid SSR issues with Leaflet
const ClusteredMap = dynamic(
  () => import('./ClusteredMap').then(mod => mod.ClusteredMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Loading map...</span>
      </div>
    )
  }
)

interface AnalyticsPageWrapperProps<T extends { id?: string | number; location?: string; status?: string }> {
  title: string;
  searchPlaceholder: string;
  filteredData: T[];
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onMarkerClick: (item: T) => void;
  mapId: string;
  dataKey: string;
  itemCountText: string;
  currentStatusFilter: string;
  children?: React.ReactNode; // For forms and dialogs
}

const center = {
  lat: 38,
  lng: -99,
}

export function AnalyticsPageWrapper<T extends { id?: string | number; location?: string; status?: string }>({
  title,
  searchPlaceholder,
  filteredData,
  onSearchChange,
  onStatusFilterChange,
  onMarkerClick,
  dataKey,
  itemCountText,
  currentStatusFilter,
  children
}: AnalyticsPageWrapperProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  }

  // Wrapper to handle the type conversion for the dynamically imported component
  const handleMarkerClick = useCallback((item: MapDataItem) => {
    onMarkerClick(item as T);
  }, [onMarkerClick]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Responsive header section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50]">{title}</h1>
          
          {/* Search and filter controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search bar */}
            <div className="w-full sm:max-w-md">
              <Input 
                className="w-full" 
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            
            {/* Status filter */}
            <div className="w-full sm:w-48">
              <Select value={currentStatusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Disabled">All Statuses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Render children (forms and dialogs) */}
      {children}

      {/* Responsive map container */}
      <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 flex flex-col">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#2C3E50]">Location Map</h2>
        <div 
          className="rounded-lg overflow-hidden border bg-gray-100"
          style={{ 
            height: 'calc(100vh - 280px)',
            minHeight: '400px'
          }}
        >
          <ClusteredMap
            data={filteredData as MapDataItem[]}
            center={center}
            zoom={4}
            onMarkerClick={handleMarkerClick}
            dataKey={dataKey}
          />
        </div>
        
        {/* Map info footer - responsive */}
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span>{itemCountText}</span>
          <span className="text-gray-500">Click markers for details • Zoom to explore clusters</span>
        </div>
      </div>
    </div>
  )
}
