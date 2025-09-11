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
import { Search, Filter, Building2, Shield, Calendar, MapPin, User, FileText, Trash2 } from "lucide-react"
import Image from "next/image"
import { TaskHazardApi } from "@/services/taskHazardApi"
import { UniversalUserApi } from "@/services/universalUserApi"
import { TaskHazard } from "@/types"

interface Company {
  id: number;
  name: string;
}

interface TaskHazardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byCompany: { [key: string]: number };
}

export default function UniversalTaskHazard() {
  const [taskHazards, setTaskHazards] = useState<TaskHazard[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TaskHazardStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    byCompany: {}
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskHazardToDelete, setTaskHazardToDelete] = useState<TaskHazard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskHazardsResponse, companiesResponse] = await Promise.all([
        TaskHazardApi.getTaskHazardsUniversal(),
        UniversalUserApi.getAllCompanies()
      ]);
      
      if (taskHazardsResponse.status && companiesResponse.status) {
        const taskHazardsData = taskHazardsResponse.data || [];
        const companiesData = companiesResponse.data || [];
        
        setTaskHazards(taskHazardsData);
        setCompanies(companiesData);
        calculateStats(taskHazardsData, companiesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch task hazard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchTaskHazards = useCallback(async () => {
    try {
      let response;
      
      if (companyFilter !== 'all') {
        response = await TaskHazardApi.getByCompany(companyFilter);
      } else {
        response = await TaskHazardApi.getTaskHazardsUniversal();
      }
      
      if (response.status && response.data) {
        let filteredData = response.data;
        
        // Apply status filter
        if (statusFilter !== 'all') {
          filteredData = filteredData.filter((th: TaskHazard) => th.status === statusFilter);
        }
        
        // Apply date filter
        if (dateFilter !== 'all') {
          const today = new Date();
          const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
          const ninetyDaysAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
          
          filteredData = filteredData.filter((th: TaskHazard) => {
            const taskDate = new Date(th.date);
            switch (dateFilter) {
              case '30days':
                return taskDate >= thirtyDaysAgo;
              case '90days':
                return taskDate >= ninetyDaysAgo;
              case 'thisYear':
                return taskDate.getFullYear() === today.getFullYear();
              default:
                return true;
            }
          });
        }
        
        setTaskHazards(filteredData);
        calculateStats(filteredData, companies);
      }
    } catch (error) {
      console.error('Error fetching task hazards:', error);
    }
  }, [companyFilter, statusFilter, dateFilter, companies]);

  // Delete task hazard function
  const handleDeleteTaskHazard = async () => {
    if (!taskHazardToDelete) return;
    
    setIsDeleting(true);
    try {
      await TaskHazardApi.deleteTaskHazardUniversal(taskHazardToDelete.id.toString());
      
      toast({
        title: "Success",
        description: "Task Hazard deleted successfully",
        variant: "default",
      });
      
      // Refresh the task hazards list
      await fetchTaskHazards();
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setTaskHazardToDelete(null);
    } catch (error) {
      console.error('Error deleting task hazard:', error);
      toast({
        title: "Error",
        description: "Failed to delete task hazard",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (taskHazard: TaskHazard) => {
    setTaskHazardToDelete(taskHazard);
    setDeleteDialogOpen(true);
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

  // Fetch task hazards when filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchTaskHazards();
    }
  }, [companyFilter, statusFilter, dateFilter, isAuthenticated, fetchTaskHazards]);

  const calculateStats = (taskHazardsList: TaskHazard[], companiesList: Company[]) => {
    const newStats: TaskHazardStats = {
      total: taskHazardsList.length,
      pending: taskHazardsList.filter(th => th.status === 'pending').length,
      approved: taskHazardsList.filter(th => th.status === 'approved').length,
      rejected: taskHazardsList.filter(th => th.status === 'rejected').length,
      byCompany: {}
    };
    
    // Calculate stats by company
    companiesList.forEach(company => {
      newStats.byCompany[company.name] = taskHazardsList.filter(th => 
        th.company?.id === company.id || th.companyId === company.id
      ).length;
    });
    
    setStats(newStats);
  };

  // Filter functions
  const filteredTaskHazards = taskHazards.filter(taskHazard => {
    const matchesSearch = 
      taskHazard.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskHazard.scopeOfWork?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskHazard.supervisor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskHazard.id?.toString().includes(searchTerm);
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Task Hazards...</p>
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
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Image 
                  src="/safety-hat.png" 
                  alt="Task Hazards" 
                  width={28} 
                  height={28} 
                  className="w-7 h-7" 
                  priority 
                />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Task Hazards</h1>
                <p className="text-gray-600 mt-1">Monitor safety assessments and hazard reports across all companies</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Pending</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Approved</p>
                    <p className="text-2xl font-bold">{stats.approved}</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Rejected</p>
                    <p className="text-2xl font-bold">{stats.rejected}</p>
                  </div>
                  <Shield className="w-8 h-8 text-red-200" />
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
                  Task Hazards by Company
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Distribution of task hazards across different companies
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-semibold text-gray-700">
                    Search
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search by location, scope, supervisor..."
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
                  <Label htmlFor="status-filter" className="text-sm font-semibold text-gray-700">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date-filter" className="text-sm font-semibold text-gray-700">
                    Date Range
                  </Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                      <SelectItem value="thisYear">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Hazards Table */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Image 
                  src="/safety-hat.png" 
                  alt="Task Hazards" 
                  width={24} 
                  height={24} 
                  className="w-6 h-6" 
                  priority 
                />
                Task Hazards ({filteredTaskHazards.length})
                {companyFilter !== 'all' && (
                  <span className="text-base text-gray-600 font-normal">
                    - {companies.find(c => c.id.toString() === companyFilter)?.name}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {companyFilter === 'all' 
                  ? 'Safety assessments and hazard reports from all companies' 
                  : 'Safety data for the selected company'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTaskHazards.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Scope of Work</TableHead>
                        <TableHead>Supervisor</TableHead>
                        <TableHead>Status</TableHead>
                        {companyFilter === 'all' && <TableHead>Company</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTaskHazards.map((taskHazard) => (
                        <TableRow key={taskHazard.id}>
                          <TableCell className="font-medium">{taskHazard.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {taskHazard.date}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {taskHazard.location}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="truncate" title={taskHazard.scopeOfWork}>
                                {taskHazard.scopeOfWork}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {taskHazard.supervisor}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={taskHazard.status === 'approved' ? 'default' : taskHazard.status === 'pending' ? 'secondary' : 'destructive'}
                            >
                              {taskHazard.status || 'Pending'}
                            </Badge>
                          </TableCell>
                          {companyFilter === 'all' && (
                            <TableCell>
                              <Badge variant="outline">
                                {taskHazard.company?.name || 'Unknown'}
                              </Badge>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Navigate to the task hazard detail view
                                  router.push(`/safety/task-hazard/${taskHazard.id}`);
                                }}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openDeleteDialog(taskHazard)}
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
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Task Hazards Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' || companyFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : 'There are no task hazards available for the selected criteria.'
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
            <DialogTitle>Delete Task Hazard</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task hazard? This action cannot be undone.
              {taskHazardToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Task Hazard Details:</p>
                  <p className="text-sm text-gray-600">ID: {taskHazardToDelete.id}</p>
                  <p className="text-sm text-gray-600">Scope: {taskHazardToDelete.scopeOfWork}</p>
                  <p className="text-sm text-gray-600">Location: {taskHazardToDelete.location}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(taskHazardToDelete.date).toLocaleDateString()}</p>
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
              onClick={handleDeleteTaskHazard}
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
                  Delete Task Hazard
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
