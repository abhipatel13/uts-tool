"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UniversalUserApi } from "@/services/universalUserApi";
import { TaskHazardApi } from "@/services/taskHazardApi";
import { TaskHazard } from "@/types";


interface TaskHazardStats {
  total: number;
  byStatus: Record<string, number>;
  byAssetSystem: Record<string, number>;
  byLocation: Record<string, number>;
  byRiskType: Record<string, number>;
}

export default function TaskHazardAnalyticsPage() {
  const [taskHazards, setTaskHazards] = useState<TaskHazard[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TaskHazardStats>({
    total: 0,
    byStatus: {},
    byAssetSystem: {},
    byLocation: {},
    byRiskType: {}
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [assetSystemFilter, setAssetSystemFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [riskTypeFilter, setRiskTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  // Calculate statistics
  const calculateStats = useCallback((data: TaskHazard[]) => {
    const newStats: TaskHazardStats = {
      total: data.length,
      byStatus: {},
      byAssetSystem: {},
      byLocation: {},
      byRiskType: {}
    };

    data.forEach(taskHazard => {
      // Status stats
      newStats.byStatus[taskHazard.status] = (newStats.byStatus[taskHazard.status] || 0) + 1;
      
      // Asset System stats
      newStats.byAssetSystem[taskHazard.assetSystem] = (newStats.byAssetSystem[taskHazard.assetSystem] || 0) + 1;
      
      // Location stats
      newStats.byLocation[taskHazard.location] = (newStats.byLocation[taskHazard.location] || 0) + 1;
      
      // Risk Type stats (from first risk if available)
      if (taskHazard.risks && taskHazard.risks.length > 0) {
        const riskType = taskHazard.risks[0].riskType;
        newStats.byRiskType[riskType] = (newStats.byRiskType[riskType] || 0) + 1;
      }
    });

    setStats(newStats);
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch companies first
      const companiesResponse = await UniversalUserApi.getAllCompanies();
      const companiesData = companiesResponse.data || [];
      setCompanies(companiesData);

      // Fetch task hazards using the universal endpoint
      try {        
        // Use the universal endpoint to fetch task hazards from all companies
        const taskHazardsResponse = await TaskHazardApi.getTaskHazardsUniversal();
        if (taskHazardsResponse.status && taskHazardsResponse.data) {
          const taskHazardsData = taskHazardsResponse.data || [];
          setTaskHazards(taskHazardsData);
          calculateStats(taskHazardsData);          
        }
      } catch (taskHazardError: unknown) {
        console.error('Error fetching task hazards from endpoint:', taskHazardError);
        
        // Set empty data to show the interface
        setTaskHazards([]);
        calculateStats([]);
        
        toast({
          title: "Error",
          description: "Failed to fetch task hazard data. Please contact your administrator.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [calculateStats, toast]);

  // Fetch task hazards with filters
  const fetchTaskHazards = useCallback(async () => {
    try {
      let response;
      
      if (companyFilter !== 'all') {
        // Filter by company if specific company is selected
        try {
                  // For universal users, we need to fetch all data first, then filter
        const allTaskHazards = await TaskHazardApi.getTaskHazardsUniversal();
        if (allTaskHazards.status && allTaskHazards.data) {
          const filteredTaskHazards = allTaskHazards.data.filter((taskHazard: TaskHazard) => 
            taskHazard.companyId === parseInt(companyFilter) || taskHazard.company?.id === parseInt(companyFilter)
          );
          setTaskHazards(filteredTaskHazards);
          calculateStats(filteredTaskHazards);
          return;
        }
        } catch (error) {
          console.error('Error fetching task hazards for company filter:', error);
          // Set empty data to show the interface
          setTaskHazards([]);
          calculateStats([]);
        }
      } else {
        try {
          // For universal users, always use the universal endpoint
          response = await TaskHazardApi.getTaskHazardsUniversal();
          if (response.status && response.data) {
            setTaskHazards(response.data);
            calculateStats(response.data);
          }
        } catch (error) {
          console.error('Error fetching all task hazards:', error);
          // Set empty data to show the interface
          setTaskHazards([]);
          calculateStats([]);
        }
      }
    } catch (error) {
      console.error('Error in fetchTaskHazards:', error);
      // Set empty data to show the interface
      setTaskHazards([]);
      calculateStats([]);
    }
  }, [companyFilter, calculateStats]);

  // Apply filters
  const filteredTaskHazards = taskHazards.filter(taskHazard => {
    const matchesStatus = statusFilter === 'all' || taskHazard.status === statusFilter;
    const matchesAssetSystem = assetSystemFilter === 'all' || taskHazard.assetSystem === assetSystemFilter;
    const matchesLocation = locationFilter === 'all' || taskHazard.location === locationFilter;
    const matchesRiskType = riskTypeFilter === 'all' || 
      taskHazard.risks.some(risk => risk.riskType === riskTypeFilter);
    const matchesCompany = companyFilter === 'all' || 
      taskHazard.companyId === parseInt(companyFilter) || 
      taskHazard.company?.id === parseInt(companyFilter);
    const matchesSearch = searchTerm === '' || 
      taskHazard.scopeOfWork.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskHazard.assetSystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskHazard.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskHazard.supervisor.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesAssetSystem && matchesLocation && matchesRiskType && matchesCompany && matchesSearch;
  });

  // Get unique values for filter options
  const getUniqueValues = (key: keyof TaskHazard) => {
    const values = new Set<string>();
    taskHazards.forEach(taskHazard => {
      const value = taskHazard[key];
      if (typeof value === 'string' && value) {
        values.add(value);
      }
    });
    return Array.from(values).sort();
  };

  // Get unique risk types
  const getUniqueRiskTypes = () => {
    const values = new Set<string>();
    taskHazards.forEach(taskHazard => {
      taskHazard.risks.forEach(risk => {
        if (risk.riskType) {
          values.add(risk.riskType);
        }
      });
    });
    return Array.from(values).sort();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTaskHazards();
  }, [fetchTaskHazards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading Task Hazard Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Task Hazard Analytics</h1>
        <div className="text-sm text-gray-500">
          Universal Portal - All Companies
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Task Hazards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus['active'] || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.byAssetSystem).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus['completed'] || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.byRiskType).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-filter">Company</Label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {getUniqueValues('status').map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-system-filter">Asset System</Label>
              <Select value={assetSystemFilter} onValueChange={setAssetSystemFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Asset Systems" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Asset Systems</SelectItem>
                  {getUniqueValues('assetSystem').map(assetSystem => (
                    <SelectItem key={assetSystem} value={assetSystem}>{assetSystem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-filter">Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {getUniqueValues('location').map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-type-filter">Risk Type</Label>
              <Select value={riskTypeFilter} onValueChange={setRiskTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Risk Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Types</SelectItem>
                  {getUniqueRiskTypes().map(riskType => (
                    <SelectItem key={riskType} value={riskType}>{riskType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search task hazards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Task Hazards ({filteredTaskHazards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTaskHazards.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope of Work</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Asset System</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Risk Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTaskHazards.map((taskHazard) => (
                  <TableRow key={taskHazard.id}>
                    <TableCell className="font-medium">{taskHazard.scopeOfWork}</TableCell>
                    <TableCell>{taskHazard.company?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{taskHazard.assetSystem}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{taskHazard.location}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {taskHazard.risks && taskHazard.risks.length > 0 ? taskHazard.risks[0].riskType : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={taskHazard.status === 'completed' ? 'default' : 
                               taskHazard.status === 'active' ? 'secondary' : 'outline'}
                      >
                        {taskHazard.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{taskHazard.supervisor}</TableCell>
                    <TableCell>{new Date(taskHazard.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || assetSystemFilter !== 'all' || locationFilter !== 'all' || riskTypeFilter !== 'all' || companyFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'There are no task hazards available for the selected criteria.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
