"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Search, Filter, Building2, MapPin, TreePine, Layers, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import Image from "next/image"
import { UniversalUserApi } from "@/services/universalUserApi"
import { AssetHierarchyApi } from "@/services/assetHierarchyApi"

interface Company {
  id: number;
  name: string;
}

interface Asset {
  id: string;
  name: string;
  description: string;
  cmmsInternalId: string;
  functionalLocation: string;
  functionalLocationDesc: string;
  functionalLocationLongDesc: string;
  parent: string | null;
  maintenancePlant: string;
  cmmsSystem: string;
  objectType: string;
  systemStatus: string;
  make: string;
  manufacturer: string;
  serialNumber: string;
  level: number;
  updatedAt: string;
  createdAt: string;
  companyId?: number;
  company?: {
    id: number;
    name: string;
  };
  children?: Asset[];
}

interface AssetStats {
  total: number;
  byObjectType: { [key: string]: number };
  bySystemStatus: { [key: string]: number };
  byCompany: { [key: string]: number };
  byLevel: { [key: string]: number };
}

export default function UniversalAssetHierarchy() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AssetStats>({
    total: 0,
    byObjectType: {},
    bySystemStatus: {},
    byCompany: {},
    byLevel: {}
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hierarchicalAssets, setHierarchicalAssets] = useState<Asset[]>([]);
  
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsResponse, companiesResponse] = await Promise.all([
        AssetHierarchyApi.getAll(),
        UniversalUserApi.getAllCompanies()
      ]);
      
      if (assetsResponse.status && companiesResponse.status) {
        const assetsData = assetsResponse.data || [];
        const companiesData = companiesResponse.data || [];
        
        setAssets(assetsData);
        setCompanies(companiesData);
        calculateStats(assetsData, companiesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch asset hierarchy data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAssets = useCallback(async () => {
    try {
      let response;
      
      if (companyFilter !== 'all') {
        // Filter by company if specific company is selected
        const allAssets = await AssetHierarchyApi.getAll();
        if (allAssets.status && allAssets.data) {
          const filteredAssets = allAssets.data.filter((asset: Asset) => 
            asset.companyId === parseInt(companyFilter) || asset.company?.id === parseInt(companyFilter)
          );
          setAssets(filteredAssets);
          
          calculateStats(filteredAssets, companies);
          return;
        }
      } else {
        response = await AssetHierarchyApi.getAll();
        if (response.status && response.data) {
          setAssets(response.data);
          calculateStats(response.data, companies);
        }
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  }, [companyFilter, companies]);

  // Helper function to build hierarchical structure
  const buildHierarchy = useCallback((assetsList: Asset[]) => {
    const assetMap = new Map<string, Asset & { children: Asset[] }>();
    const rootAssets: Asset[] = [];

    // First pass: create map of all assets with children array
    assetsList.forEach(asset => {
      assetMap.set(asset.id, { ...asset, children: [] });
    });

    // Second pass: build parent-child relationships
    assetsList.forEach(asset => {
      const assetWithChildren = assetMap.get(asset.id);
      if (assetWithChildren) {
        if (asset.parent && assetMap.has(asset.parent)) {
          // Add to parent's children
          const parent = assetMap.get(asset.parent);
          if (parent) {
            parent.children.push(assetWithChildren);
          }
        } else {
          // Root level asset (no parent or parent not found)
          rootAssets.push(assetWithChildren);
        }
      }
    });

    return rootAssets;
  }, []);

  // Delete asset function
  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    
    setIsDeleting(true);
    try {
      await AssetHierarchyApi.deleteAssetUniversal(assetToDelete.id.toString());
      
      toast({
        title: "Success",
        description: "Asset deleted successfully",
        variant: "default",
      });
      
      // Refresh the assets list
      await fetchAssets();
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (asset: Asset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  // Helper function to flatten hierarchy for display based on expanded state
  const flattenHierarchy = useCallback((assets: Asset[], level = 0): Asset[] => {
    const result: Asset[] = [];
    
    assets.forEach(asset => {
      // Add the current asset with its level
      result.push({ ...asset, level });
      
      // If this asset is expanded and has children, add its children recursively
      if (expandedNodes.has(asset.id) && asset.children && asset.children.length > 0) {
        result.push(...flattenHierarchy(asset.children, level + 1));
      }
    });
    
    return result;
  }, [expandedNodes]);

  // Toggle expansion of a node
  const toggleExpansion = (assetId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
    }
    setExpandedNodes(newExpanded);
  };

  // Check if asset has children
  const hasChildren = (asset: Asset) => {
    return asset.children && asset.children.length > 0;
  };

  // Authentication and initial data loading
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setLoading(false);
        router.push('/login');
        return;
      }

      try {
        const user = JSON.parse(userData);
        if (user.role !== 'universal_user') {
          setLoading(false);
          router.push('/dashboard');
          return;
        }
        
        setIsAuthenticated(true);
        fetchData();
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoading(false);
        router.push('/login');
      }
    };

    if (typeof window !== 'undefined') {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [router, fetchData]);

  // Fetch assets when filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssets();
    }
  }, [companyFilter, isAuthenticated, fetchAssets]);

  // Build hierarchy when assets change
  useEffect(() => {
    if (assets.length > 0) {
      const hierarchy = buildHierarchy(assets);
      setHierarchicalAssets(hierarchy);
    }
  }, [assets, buildHierarchy]);

  const calculateStats = (assetsList: Asset[], companiesList: Company[]) => {
    const newStats: AssetStats = {
      total: assetsList.length,
      byObjectType: {},
      bySystemStatus: {},
      byCompany: {},
      byLevel: {}
    };
    
    // Calculate stats by object type
    assetsList.forEach(asset => {
      newStats.byObjectType[asset.objectType] = (newStats.byObjectType[asset.objectType] || 0) + 1;
    });
    
    // Calculate stats by system status
    assetsList.forEach(asset => {
      newStats.bySystemStatus[asset.systemStatus] = (newStats.bySystemStatus[asset.systemStatus] || 0) + 1;
    });
    
    // Calculate stats by company
    companiesList.forEach(company => {
      newStats.byCompany[company.name] = assetsList.filter(asset => 
        asset.companyId === company.id || asset.company?.id === company.id
      ).length;
    });
    
    // Calculate stats by level
    assetsList.forEach(asset => {
      const levelKey = `Level ${asset.level}`;
      newStats.byLevel[levelKey] = (newStats.byLevel[levelKey] || 0) + 1;
    });
    
    setStats(newStats);
  };

    // Filter functions - now works with hierarchical structure
  const getFilteredHierarchicalAssets = () => {
    // Get flattened hierarchy for display
    const flatAssets = flattenHierarchy(hierarchicalAssets);
    
    // Apply filters to the flattened hierarchy
    return flatAssets.filter(asset => {
      const matchesSearch = 
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.objectType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.functionalLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.id?.toString().includes(searchTerm);

      const matchesType = typeFilter === 'all' || asset.objectType === typeFilter;
      const matchesStatus = statusFilter === 'all' || asset.systemStatus === statusFilter;
      const matchesLevel = levelFilter === 'all' || asset.level.toString() === levelFilter;

      return matchesSearch && matchesType && matchesStatus && matchesLevel;
    });
  };

  const filteredAssets = getFilteredHierarchicalAssets();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Asset Hierarchy...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="flex flex-col space-y-6 p-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Image 
                  src="/asset-hierarchy.png" 
                  alt="Asset Hierarchy" 
                  width={28} 
                  height={28} 
                  className="w-7 h-7" 
                  priority 
                />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Asset Hierarchy</h1>
                <p className="text-gray-600 mt-1">Monitor and manage assets across all companies</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Assets</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <TreePine className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Companies</p>
                    <p className="text-2xl font-bold">{companies.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Asset Types</p>
                    <p className="text-2xl font-bold">{Object.keys(stats.byObjectType).length}</p>
                  </div>
                  <Layers className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Max Level</p>
                    <p className="text-2xl font-bold">
                      {Object.keys(stats.byLevel).length > 0 
                        ? Math.max(...Object.keys(stats.byLevel).map(k => parseInt(k.replace('Level ', ''))))
                        : 0
                      }
                    </p>
                  </div>
                  <TreePine className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Stats */}
          {Object.keys(stats.byCompany).length > 0 && (
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Assets by Company
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Distribution of assets across different companies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.byCompany).map(([companyName, count]) => (
                    <div key={companyName} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{count}</div>
                      <div className="text-sm text-gray-600 truncate">{companyName}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                Filters & Search
              </CardTitle>
              <CardDescription className="text-gray-600">
                Refine your search and filter results
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-semibold text-gray-700">
                    Search
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search by name, type, location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company-filter" className="text-sm font-semibold text-gray-700">
                    Company
                  </Label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type-filter" className="text-sm font-semibold text-gray-700">
                    Asset Type
                  </Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.keys(stats.byObjectType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-filter" className="text-sm font-semibold text-gray-700">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.keys(stats.bySystemStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level-filter" className="text-sm font-semibold text-gray-700">
                    Level
                  </Label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {Object.keys(stats.byLevel).map((level) => (
                        <SelectItem key={level} value={level.replace('Level ', '')}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assets Table */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Image 
                  src="/asset-hierarchy.png" 
                  alt="Asset Hierarchy" 
                  width={24} 
                  height={24} 
                  className="w-6 h-6" 
                  priority 
                />
                Assets ({filteredAssets.length})
                {companyFilter !== 'all' && (
                  <span className="text-base text-gray-600 font-normal">
                    - {companies.find(c => c.id.toString() === companyFilter)?.name}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {companyFilter === 'all' 
                  ? 'All assets across all companies' 
                  : 'Assets for the selected company'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAssets.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Object Type</TableHead>
                        <TableHead>Functional Location</TableHead>
                        <TableHead>System Status</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Parent</TableHead>
                        {companyFilter === 'all' && <TableHead>Company</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.id}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {hasChildren(asset) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6 mr-2"
                                  onClick={() => toggleExpansion(asset.id)}
                                >
                                  {expandedNodes.has(asset.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              ) : (
                                <div className="w-8 mr-2" /> 
                              )}
                              <div style={{ marginLeft: `${asset.level * 20}px` }}>
                                <span>{asset.name}</span>
                                {asset.level === 0 && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Root Asset
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{asset.objectType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {asset.functionalLocation}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                asset.systemStatus === 'active' ? 'default' : 
                                asset.systemStatus === 'inactive' ? 'secondary' : 
                                asset.systemStatus === 'maintenance' ? 'destructive' : 'outline'
                              }
                            >
                              {asset.systemStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Level {asset.level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {asset.parent ? (
                              <Badge variant="outline">{asset.parent}</Badge>
                            ) : (
                              <span className="text-gray-400">Root</span>
                            )}
                          </TableCell>
                          {companyFilter === 'all' && (
                            <TableCell>
                              <Badge variant="outline">
                                {asset.company?.name || 'Unknown'}
                              </Badge>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Navigate to the asset detail view
                                  router.push(`/asset-hierarchy/${asset.id}`);
                                }}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openDeleteDialog(asset)}
                                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TreePine className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Assets Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || companyFilter !== 'all' || levelFilter !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : 'There are no assets available for the selected criteria.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
              {assetToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Asset Details:</p>
                  <p className="text-sm text-gray-600">ID: {assetToDelete.id}</p>
                  <p className="text-sm text-gray-600">Name: {assetToDelete.name}</p>
                  <p className="text-sm text-gray-600">Type: {assetToDelete.objectType}</p>
                  <p className="text-sm text-gray-600">Location: {assetToDelete.functionalLocation}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAsset}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Asset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
