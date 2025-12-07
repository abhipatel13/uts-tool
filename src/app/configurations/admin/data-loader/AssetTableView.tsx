"use client"

import { useState, useMemo, useCallback, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ParsedAsset, ValidationResult } from '@/types/validation'
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Filter,
  RefreshCw,
  Ghost,
  Copy,
  Check,
  Columns,
  AlertCircle,
  Trash2,
  FileX
} from 'lucide-react'

// Error filter type
type ErrorFilter = 'all' | 'errors_only' | 'valid_only' | 'duplicates' | 'orphans' | 'cycles' | 'missing_names' | 'modified' | 'deleted'

interface AssetTableViewProps {
  assets: ParsedAsset[]
  validationResult: ValidationResult | null
  modifiedRows: Set<number>
  deletedRows: Set<number>
  onRowClick?: (asset: ParsedAsset) => void
}

export function AssetTableView({
  assets,
  validationResult,
  modifiedRows,
  deletedRows,
  onRowClick,
}: AssetTableViewProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [errorFilter, setErrorFilter] = useState<ErrorFilter>('all')

  // Build error lookup maps for performance
  const errorMaps = useMemo(() => {
    if (!validationResult) return { 
      duplicateRows: new Set<number>(), 
      orphanRows: new Set<number>(), 
      cycleRows: new Set<number>(),
      missingNameRows: new Set<number>()
    }
    
    const duplicateRows = new Set<number>()
    const orphanRows = new Set<number>()
    const cycleRows = new Set<number>()
    const missingNameRows = new Set<number>()

    validationResult.duplicates.forEach(dup => {
      dup.rows.forEach(row => duplicateRows.add(row))
    })

    validationResult.orphanGroups.forEach(group => {
      group.orphans.forEach(orphan => orphanRows.add(orphan.row))
    })

    validationResult.cycles.forEach(cycle => {
      cycle.rows.forEach(row => cycleRows.add(row))
    })

    validationResult.missingNames.forEach(missing => {
      missingNameRows.add(missing.row)
    })

    return { duplicateRows, orphanRows, cycleRows, missingNameRows }
  }, [validationResult])

  // Filter assets based on error filter
  const filteredAssets = useMemo(() => {
    let result = assets

    switch (errorFilter) {
      case 'errors_only':
        result = assets.filter(a => 
          errorMaps.duplicateRows.has(a.row) || 
          errorMaps.orphanRows.has(a.row) || 
          errorMaps.cycleRows.has(a.row) ||
          errorMaps.missingNameRows.has(a.row)
        )
        break
      case 'valid_only':
        result = assets.filter(a => 
          !errorMaps.duplicateRows.has(a.row) && 
          !errorMaps.orphanRows.has(a.row) && 
          !errorMaps.cycleRows.has(a.row) &&
          !errorMaps.missingNameRows.has(a.row)
        )
        break
      case 'duplicates':
        result = assets.filter(a => errorMaps.duplicateRows.has(a.row))
        break
      case 'orphans':
        result = assets.filter(a => errorMaps.orphanRows.has(a.row))
        break
      case 'cycles':
        result = assets.filter(a => errorMaps.cycleRows.has(a.row))
        break
      case 'missing_names':
        result = assets.filter(a => errorMaps.missingNameRows.has(a.row))
        break
      case 'modified':
        result = assets.filter(a => modifiedRows.has(a.row))
        break
      case 'deleted':
        result = assets.filter(a => deletedRows.has(a.row))
        break
    }

    return result
  }, [assets, errorFilter, errorMaps, modifiedRows, deletedRows])

  // Define columns
  const columns = useMemo<ColumnDef<ParsedAsset>[]>(() => [
    {
      accessorKey: 'row',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 -ml-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Row
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-1 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const asset = row.original
        const isDeleted = deletedRows.has(asset.row)
        const isModified = modifiedRows.has(asset.row)
        
        return (
          <div className="flex items-center gap-1">
            <span className={`font-mono text-xs ${isDeleted ? 'line-through text-gray-400' : ''}`}>
              {asset.row}
            </span>
            {isDeleted && <Trash2 className="w-3 h-3 text-red-500" />}
            {isModified && !isDeleted && <Check className="w-3 h-3 text-green-500" />}
          </div>
        )
      },
      size: 70,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const asset = row.original
        const isDuplicate = errorMaps.duplicateRows.has(asset.row)
        const isOrphan = errorMaps.orphanRows.has(asset.row)
        const inCycle = errorMaps.cycleRows.has(asset.row)
        const hasMissingName = errorMaps.missingNameRows.has(asset.row)
        const isDeleted = deletedRows.has(asset.row)
        const isModified = modifiedRows.has(asset.row)
        
        if (isDeleted) {
          return <Badge variant="destructive" className="text-xs">Deleted</Badge>
        }
        
        if (isModified && !isDuplicate && !isOrphan && !inCycle && !hasMissingName) {
          return <Badge className="bg-green-600 text-xs">Fixed</Badge>
        }

        const errors: React.ReactNode[] = []
        if (isDuplicate) errors.push(
          <Badge key="dup" variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
            <Copy className="w-2.5 h-2.5 mr-1" />Dup
          </Badge>
        )
        if (isOrphan) errors.push(
          <Badge key="orph" variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
            <Ghost className="w-2.5 h-2.5 mr-1" />Orphan
          </Badge>
        )
        if (inCycle) errors.push(
          <Badge key="cyc" variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            <RefreshCw className="w-2.5 h-2.5 mr-1" />Cycle
          </Badge>
        )
        if (hasMissingName) errors.push(
          <Badge key="noname" variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <FileX className="w-2.5 h-2.5 mr-1" />No Name
          </Badge>
        )

        if (errors.length === 0) {
          return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Valid</Badge>
        }

        return <div className="flex gap-1 flex-wrap">{errors}</div>
      },
      size: 120,
      enableSorting: false,
    },
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 -ml-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          ID
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-1 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs truncate max-w-[150px] block" title={row.original.id}>
          {row.original.id}
        </span>
      ),
      size: 150,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 -ml-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-1 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="truncate max-w-[200px] block" title={row.original.name}>
          {row.original.name}
        </span>
      ),
      size: 200,
    },
    {
      accessorKey: 'parentId',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 -ml-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Parent ID
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-1 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const parentId = row.original.parentId
        const isOrphan = errorMaps.orphanRows.has(row.original.row)
        
        if (!parentId) {
          return <span className="text-gray-400 text-xs italic">Root</span>
        }
        
        return (
          <span 
            className={`font-mono text-xs truncate max-w-[150px] block ${isOrphan ? 'text-red-600' : ''}`}
            title={parentId}
          >
            {isOrphan && <AlertCircle className="w-3 h-3 inline mr-1" />}
            {parentId}
          </span>
        )
      },
      size: 150,
    },
  ], [errorMaps, modifiedRows, deletedRows])

  // Create table instance
  const table = useReactTable({
    data: filteredAssets,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const { rows } = table.getRowModel()

  // Virtualization
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  // Handle row click
  const handleRowClick = useCallback((asset: ParsedAsset) => {
    if (onRowClick) {
      onRowClick(asset)
    }
  }, [onRowClick])

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: assets.length,
    errors_only: assets.filter(a => 
      errorMaps.duplicateRows.has(a.row) || 
      errorMaps.orphanRows.has(a.row) || 
      errorMaps.cycleRows.has(a.row) ||
      errorMaps.missingNameRows.has(a.row)
    ).length,
    valid_only: assets.filter(a => 
      !errorMaps.duplicateRows.has(a.row) && 
      !errorMaps.orphanRows.has(a.row) && 
      !errorMaps.cycleRows.has(a.row) &&
      !errorMaps.missingNameRows.has(a.row)
    ).length,
    duplicates: assets.filter(a => errorMaps.duplicateRows.has(a.row)).length,
    orphans: assets.filter(a => errorMaps.orphanRows.has(a.row)).length,
    cycles: assets.filter(a => errorMaps.cycleRows.has(a.row)).length,
    missing_names: assets.filter(a => errorMaps.missingNameRows.has(a.row)).length,
    modified: assets.filter(a => modifiedRows.has(a.row)).length,
    deleted: assets.filter(a => deletedRows.has(a.row)).length,
  }), [assets, errorMaps, modifiedRows, deletedRows])

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                <Filter className="w-4 h-4 mr-2" />
                {errorFilter === 'all' ? 'All Assets' : 
                errorFilter === 'errors_only' ? 'Errors Only' :
                errorFilter === 'valid_only' ? 'Valid Only' :
                errorFilter === 'duplicates' ? 'Duplicates' :
                errorFilter === 'orphans' ? 'Orphans' :
                errorFilter === 'cycles' ? 'Cycles' :
                errorFilter === 'missing_names' ? 'Missing Names' :
                errorFilter === 'modified' ? 'Modified' : 'Deleted'}
                <Badge variant="secondary" className="ml-2 text-xs">
                    {filteredAssets.length}
                </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuCheckboxItem
                checked={errorFilter === 'all'}
                onCheckedChange={() => setErrorFilter('all')}
                >
                All Assets ({filterCounts.all})
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                checked={errorFilter === 'errors_only'}
                onCheckedChange={() => setErrorFilter('errors_only')}
                >
                Errors Only ({filterCounts.errors_only})
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                checked={errorFilter === 'valid_only'}
                onCheckedChange={() => setErrorFilter('valid_only')}
                >
                Valid Only ({filterCounts.valid_only})
                </DropdownMenuCheckboxItem>
                <div className="h-px bg-gray-200 my-1" />
                <DropdownMenuCheckboxItem
                checked={errorFilter === 'duplicates'}
                onCheckedChange={() => setErrorFilter('duplicates')}
                >
                <Copy className="w-3 h-3 mr-2 text-orange-600" />
                Duplicates ({filterCounts.duplicates})
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                checked={errorFilter === 'orphans'}
                onCheckedChange={() => setErrorFilter('orphans')}
                >
                <Ghost className="w-3 h-3 mr-2 text-red-600" />
                Orphans ({filterCounts.orphans})
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                checked={errorFilter === 'cycles'}
                onCheckedChange={() => setErrorFilter('cycles')}
                >
                <RefreshCw className="w-3 h-3 mr-2 text-purple-600" />
                Cycles ({filterCounts.cycles})
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                checked={errorFilter === 'missing_names'}
                onCheckedChange={() => setErrorFilter('missing_names')}
                >
                <FileX className="w-3 h-3 mr-2 text-blue-600" />
                Missing Names ({filterCounts.missing_names})
                </DropdownMenuCheckboxItem>
                <div className="h-px bg-gray-200 my-1" />
                <DropdownMenuCheckboxItem
                checked={errorFilter === 'modified'}
                onCheckedChange={() => setErrorFilter('modified')}
                >
                <Check className="w-3 h-3 mr-2 text-green-600" />
                Modified ({filterCounts.modified})
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                checked={errorFilter === 'deleted'}
                onCheckedChange={() => setErrorFilter('deleted')}
                >
                <Trash2 className="w-3 h-3 mr-2 text-red-600" />
                Deleted ({filterCounts.deleted})
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
            </DropdownMenu>

            {/* Column Visibility */}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                <Columns className="w-4 h-4 mr-2" />
                Columns
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table.getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                    <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                    {column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Summary */}
      <div className="text-xs text-gray-500">
        Showing {filteredAssets.length} of {assets.length} assets
        {globalFilter && ` matching "${globalFilter}"`}
      </div>

      {/* Table */}
      <div 
        ref={tableContainerRef}
        className="border rounded-lg overflow-auto bg-white"
        style={{ height: '400px' }}
      >
        <div style={{ height: `${totalSize}px`, width: '100%', position: 'relative' }}>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-50 border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <div key={headerGroup.id} className="flex">
                {headerGroup.headers.map(header => (
                  <div
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                    style={{ width: header.getSize(), flexShrink: 0 }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Virtual Rows */}
          {virtualRows.map(virtualRow => {
            const row = rows[virtualRow.index]
            const asset = row.original
            const isDeleted = deletedRows.has(asset.row)

            return (
              <div
                key={row.id}
                className={`flex border-b cursor-pointer transition-colors ${
                  isDeleted 
                    ? 'bg-red-50 opacity-60' 
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start + 40}px)`, // +40 for header height
                }}
                onClick={() => handleRowClick(asset)}
              >
                {row.getVisibleCells().map(cell => (
                  <div
                    key={cell.id}
                    className="px-3 py-2 flex items-center"
                    style={{ width: cell.column.getSize(), flexShrink: 0 }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            )
          })}

          {/* Empty State */}
          {rows.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 mt-10">
              No assets match the current filter
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

