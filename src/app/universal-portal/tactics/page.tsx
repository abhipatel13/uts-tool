"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Search, Filter, Building2, Target, Calendar, MapPin, User, FileText, Zap, Layers } from "lucide-react"
import Image from "next/image"
import { UniversalUserApi } from "@/services/universalUserApi"
import { TacticsApi } from "@/services/tacticsApi"

interface Company {
  id: number;
  name: string;
}

interface Tactic {
  id: string;
  analysis_name: string;
  location: string;
  status: string;
  asset_details: {
    asset_id: string;
    manufacturer: string;
    model: string;
    asset_group: string;
    description: string;
    criticality: string;
    failure_mode: string;
    failure_cause: string;
    failure_effect: string;
    failure_evident: string;
    affects_safety: string;
    suitable_task: string;
    maintenance_strategy: string;
    controls: string;
    actions: string;
    responsibility: string;
    activity_name: string;
    activity_desc: string;
    activity_type: string;
    activity_cause: string;
    activity_source: string;
    tactic: string;
    shutdown: string;
    department: string;
    frequency: string;
    doc_number: string;
    doc_desc: string;
    picture: string;
    resource: string;
    hours: string;
    units: string;
    overhaul: string;
    shutdowns: string;
  };
  company: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface TacticStats {
  total: number;
  byAssetGroup: { [key: string]: number };
  byCriticality: { [key: string]: number };
  byStatus: { [key: string]: number };
  byCompany: { [key: string]: number };
  byDepartment: { [key: string]: number };
}

export default function UniversalTactics() {
  const [tactics, setTactics] = useState<Tactic[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TacticStats>({
    total: 0,
    byAssetGroup: {},
    byCriticality: {},
    byStatus: {},
    byCompany: {},
    byDepartment: {}
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tacticsResponse, companiesResponse] = await Promise.all([
        TacticsApi.getAllUniversal(),
        UniversalUserApi.getAllCompanies()
      ]);
      
      if (tacticsResponse.status && companiesResponse.status) {
        const tacticsData = tacticsResponse.data || [];
        const companiesData = companiesResponse.data || [];
        
        setTactics(tacticsData);
        setCompanies(companiesData);
        calculateStats(tacticsData, companiesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tactics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchTactics = useCallback(async () => {
    try {
      let response;
      
      if (companyFilter !== 'all') {
        // Filter by company if specific company is selected
        const allTactics = await TacticsApi.getAllUniversal();
        if (allTactics.status && allTactics.data) {
          const companyName = companies.find(c => c.id.toString() === companyFilter)?.name;
          const filteredTactics = allTactics.data.filter((tactic: Tactic) => 
            tactic.company === companyName
          );
          setTactics(filteredTactics);
          calculateStats(filteredTactics, companies);
          return;
        }
      } else {
        response = await TacticsApi.getAllUniversal();
        if (response.status && response.data) {
          setTactics(response.data);
          calculateStats(response.data, companies);
        }
      }
    } catch (error) {
      console.error('Error fetching tactics:', error);
    }
  }, [companyFilter, companies]);

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

  // Fetch tactics when filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchTactics();
    }
  }, [companyFilter, isAuthenticated, fetchTactics]);

  const calculateStats = (tacticsList: Tactic[], companiesList: Company[]) => {
    const newStats: TacticStats = {
      total: tacticsList.length,
      byAssetGroup: {},
      byCriticality: {},
      byStatus: {},
      byCompany: {},
      byDepartment: {}
    };
    
    // Calculate stats by asset group
    tacticsList.forEach(tactic => {
      newStats.byAssetGroup[tactic.asset_details.asset_group] = (newStats.byAssetGroup[tactic.asset_details.asset_group] || 0) + 1;
    });
    
    // Calculate stats by criticality
    tacticsList.forEach(tactic => {
      newStats.byCriticality[tactic.asset_details.criticality] = (newStats.byCriticality[tactic.asset_details.criticality] || 0) + 1;
    });
    
    // Calculate stats by status
    tacticsList.forEach(tactic => {
      newStats.byStatus[tactic.status] = (newStats.byStatus[tactic.status] || 0) + 1;
    });
    
    // Calculate stats by company
    companiesList.forEach(company => {
      newStats.byCompany[company.name] = tacticsList.filter(tactic => 
        tactic.company === company.name
      ).length;
    });
    
    // Calculate stats by department
    tacticsList.forEach(tactic => {
      if (tactic.asset_details.department) {
        newStats.byDepartment[tactic.asset_details.department] = (newStats.byDepartment[tactic.asset_details.department] || 0) + 1;
      }
    });
    
    setStats(newStats);
  };

  // Filter functions
  const filteredTactics = tactics.filter(tactic => {
    const matchesSearch = 
      tactic.analysis_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tactic.asset_details.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tactic.asset_details.asset_group?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tactic.id?.toString().includes(searchTerm);
    
    const matchesCategory = categoryFilter === 'all' || tactic.asset_details.asset_group === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || tactic.asset_details.criticality === priorityFilter;
    const matchesStatus = statusFilter === 'all' || tactic.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || tactic.asset_details.department === departmentFilter;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Tactics...</p>
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
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Tactics</h1>
                <p className="text-gray-600 mt-1">Monitor and manage tactics across all companies</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Tactics</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-200" />
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

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Asset Groups</p>
                    <p className="text-2xl font-bold">{Object.keys(stats.byAssetGroup).length}</p>
                  </div>
                  <Layers className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Departments</p>
                    <p className="text-2xl font-bold">{Object.keys(stats.byDepartment).length}</p>
                  </div>
                  <Zap className="w-8 h-8 text-orange-200" />
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
                  Tactics by Company
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Distribution of tactics across different companies
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-semibold text-gray-700">
                    Search
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search by name, description..."
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
                  <Label htmlFor="category-filter" className="text-sm font-semibold text-gray-700">
                    Asset Group
                  </Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All asset groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Asset Groups</SelectItem>
                      {Object.keys(stats.byAssetGroup).map((assetGroup) => (
                        <SelectItem key={assetGroup} value={assetGroup}>
                          {assetGroup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority-filter" className="text-sm font-semibold text-gray-700">
                    Criticality
                  </Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All criticalities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Criticalities</SelectItem>
                      {Object.keys(stats.byCriticality).map((criticality) => (
                        <SelectItem key={criticality} value={criticality}>
                          {criticality}
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
                      {Object.keys(stats.byStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department-filter" className="text-sm font-semibold text-gray-700">
                    Department
                  </Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {Object.keys(stats.byDepartment).map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tactics Table */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Target className="w-6 h-6 text-purple-600" />
                Tactics ({filteredTactics.length})
                {companyFilter !== 'all' && (
                  <span className="text-base text-gray-600 font-normal">
                    - {companies.find(c => c.id.toString() === companyFilter)?.name}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {companyFilter === 'all' 
                  ? 'All tactics across all companies' 
                  : 'Tactics for the selected company'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTactics.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Analysis Name</TableHead>
                        <TableHead>Asset Group</TableHead>
                        <TableHead>Criticality</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Created By</TableHead>
                        {companyFilter === 'all' && <TableHead>Company</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTactics.map((tactic) => (
                                                 <TableRow key={tactic.id}>
                           <TableCell className="font-medium">{tactic.id}</TableCell>
                           <TableCell className="font-medium">{tactic.analysis_name}</TableCell>
                           <TableCell>
                             <Badge variant="outline">{tactic.asset_details.asset_group}</Badge>
                           </TableCell>
                           <TableCell>
                             <Badge 
                               variant={
                                 tactic.asset_details.criticality === 'high' ? 'destructive' : 
                                 tactic.asset_details.criticality === 'medium' ? 'default' : 
                                 tactic.asset_details.criticality === 'low' ? 'secondary' : 'outline'
                               }
                             >
                               {tactic.asset_details.criticality}
                             </Badge>
                           </TableCell>
                           <TableCell>
                             <Badge 
                               variant={
                                 tactic.status === 'active' ? 'default' : 
                                 tactic.status === 'inactive' ? 'secondary' : 
                                 tactic.status === 'completed' ? 'destructive' : 'outline'
                               }
                             >
                               {tactic.status}
                             </Badge>
                           </TableCell>
                           <TableCell>
                             {tactic.asset_details.department ? (
                               <Badge variant="secondary">{tactic.asset_details.department}</Badge>
                             ) : (
                               <span className="text-gray-400">-</span>
                             )}
                           </TableCell>
                           <TableCell>
                             {tactic.created_by ? (
                               <div className="flex items-center gap-2">
                                 <User className="w-4 h-4 text-gray-400" />
                                 {tactic.created_by}
                               </div>
                             ) : (
                               <span className="text-gray-400">Unknown</span>
                             )}
                           </TableCell>
                                                     {companyFilter === 'all' && (
                             <TableCell>
                               <Badge variant="outline">
                                 {tactic.company || 'Unknown'}
                               </Badge>
                             </TableCell>
                           )}
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Navigate to the tactic detail view
                                router.push(`/tactics/${tactic.id}`);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tactics Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all' || companyFilter !== 'all' || departmentFilter !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : 'There are no tactics available for the selected criteria.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
