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
import { Search, Filter, Building2, Shield, User, AlertTriangle, Layers, Trash2 } from "lucide-react"
import { UniversalUserApi } from "@/services/universalUserApi"
import { RiskAssessmentApi } from "@/services/riskAssessmentApi"
import type { RiskAssessment } from "@/types"

interface Company {
  id: number;
  name: string;
}

interface RiskAssessmentStats {
  total: number;
  byRiskType: { [key: string]: number };
  byStatus: { [key: string]: number };
  byCompany: { [key: string]: number };
  byAssetSystem: { [key: string]: number };
  byLocation: { [key: string]: number };
}

export default function UniversalRiskAssessment() {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RiskAssessmentStats>({
    total: 0,
    byRiskType: {},
    byStatus: {},
    byCompany: {},
    byAssetSystem: {},
    byLocation: {}
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riskAssessmentToDelete, setRiskAssessmentToDelete] = useState<RiskAssessment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // For Universal Users, we need to handle the company requirement differently
      const companiesResponse = await UniversalUserApi.getAllCompanies();
      
      if (companiesResponse.status) {
        const companiesData = companiesResponse.data || [];
        setCompanies(companiesData);
        
        // Try to fetch risk assessments using the universal endpoint
        try {
          // Use the universal endpoint that bypasses company restrictions
          const riskAssessmentsResponse = await RiskAssessmentApi.getRiskAssessmentsUniversal();
          if (riskAssessmentsResponse.status && riskAssessmentsResponse.data) {
            const riskAssessmentsData = riskAssessmentsResponse.data || [];
            setRiskAssessments(riskAssessmentsData);
            calculateStats(riskAssessmentsData, companiesData);            
          }
        } catch (riskError: unknown) {
          console.error('Error fetching risk assessments from universal endpoint:', riskError);
          
          // Set empty data to show the interface
          setRiskAssessments([]);
          calculateStats([], companiesData);
          
          toast({
            title: "Error",
            description: "Failed to fetch risk assessment data. Please contact your administrator.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchRiskAssessments = useCallback(async () => {
    try {
      let response;
      
      if (companyFilter !== 'all') {
        // Filter by company if specific company is selected
        try {
          // For universal users, we need to fetch all data first, then filter
          const allRiskAssessments = await RiskAssessmentApi.getRiskAssessmentsUniversal();
          if (allRiskAssessments.status && allRiskAssessments.data) {
            const filteredRiskAssessments = allRiskAssessments.data.filter((assessment: RiskAssessment) => 
              assessment.company_id === parseInt(companyFilter) || assessment.company?.id === parseInt(companyFilter)
            );
            setRiskAssessments(filteredRiskAssessments);
            calculateStats(filteredRiskAssessments, companies);
            return;
          }
        } catch (error) {
          console.error('Error fetching risk assessments for company filter:', error);
          // Set empty data to show the interface
          setRiskAssessments([]);
          calculateStats([], companies);
        }
      } else {
        try {
          // For universal users, always use the universal endpoint
          response = await RiskAssessmentApi.getRiskAssessmentsUniversal();
          if (response.status && response.data) {
            setRiskAssessments(response.data);
            calculateStats(response.data, companies);
          }
        } catch (error) {
          console.error('Error fetching all risk assessments:', error);
          // Set empty data to show the interface
          setRiskAssessments([]);
          calculateStats([], companies);
        }
      }
    } catch (error) {
      console.error('Error in fetchRiskAssessments:', error);
      // Set empty data to show the interface
      setRiskAssessments([]);
      calculateStats([], companies);
    }
  }, [companyFilter, companies]);

  // Delete risk assessment function
  const handleDeleteRiskAssessment = async () => {
    if (!riskAssessmentToDelete) return;
    
    setIsDeleting(true);
    try {
      await RiskAssessmentApi.deleteRiskAssessmentUniversal(riskAssessmentToDelete.id.toString());
      
      toast({
        title: "Success",
        description: "Risk Assessment deleted successfully",
        variant: "default",
      });
      
      // Refresh the risk assessments list
      await fetchRiskAssessments();
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setRiskAssessmentToDelete(null);
    } catch (error) {
      console.error('Error deleting risk assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete risk assessment",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (riskAssessment: RiskAssessment) => {
    setRiskAssessmentToDelete(riskAssessment);
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

  // Fetch risk assessments when filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchRiskAssessments();
    }
  }, [companyFilter, isAuthenticated, fetchRiskAssessments]);

  const calculateStats = (assessmentsList: RiskAssessment[], companiesList: Company[]) => {
    const newStats: RiskAssessmentStats = {
      total: assessmentsList.length,
      byRiskType: {},
      byStatus: {},
      byCompany: {},
      byAssetSystem: {},
      byLocation: {}
    };
    
    // Calculate stats by risk type (from individual risks)
    assessmentsList.forEach(assessment => {
      assessment.risks.forEach(risk => {
        newStats.byRiskType[risk.riskType] = (newStats.byRiskType[risk.riskType] || 0) + 1;
      });
    });
    
    // Calculate stats by status
    assessmentsList.forEach(assessment => {
      newStats.byStatus[assessment.status] = (newStats.byStatus[assessment.status] || 0) + 1;
    });
    
    // Calculate stats by company
    companiesList.forEach(company => {
      newStats.byCompany[company.name] = assessmentsList.filter(assessment => 
        assessment.company_id === company.id || assessment.company?.id === company.id
      ).length;
    });
    
    // Calculate stats by asset system
    assessmentsList.forEach(assessment => {
      if (assessment.assetSystem) {
        newStats.byAssetSystem[assessment.assetSystem] = (newStats.byAssetSystem[assessment.assetSystem] || 0) + 1;
      }
    });
    
    // Calculate stats by location
    assessmentsList.forEach(assessment => {
      if (assessment.location) {
        newStats.byLocation[assessment.location] = (newStats.byLocation[assessment.location] || 0) + 1;
      }
    });
    
    setStats(newStats);
  };

  // Filter functions
  const filteredRiskAssessments = riskAssessments.filter(assessment => {
    const matchesSearch = 
      assessment.scopeOfWork?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.assetSystem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.id?.toString().includes(searchTerm);
    
    const matchesRiskType = riskLevelFilter === 'all' || assessment.risks.some(risk => risk.riskType === riskLevelFilter);
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    const matchesAssetSystem = departmentFilter === 'all' || assessment.assetSystem === departmentFilter;
    const matchesLocation = categoryFilter === 'all' || assessment.location === categoryFilter;
    
    return matchesSearch && matchesRiskType && matchesStatus && matchesAssetSystem && matchesLocation;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Risk Assessments...</p>
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
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Risk Assessment</h1>
                <p className="text-gray-600 mt-1">Monitor and manage risk assessments across all companies</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Total Assessments</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Shield className="w-8 h-8 text-red-200" />
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
                    <p className="text-blue-100 text-sm">Risk Types</p>
                    <p className="text-2xl font-bold">{Object.keys(stats.byRiskType).length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Asset Systems</p>
                    <p className="text-2xl font-bold">{Object.keys(stats.byAssetSystem).length}</p>
                  </div>
                  <Layers className="w-8 h-8 text-orange-200" />
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
                  Risk Assessments by Company
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Distribution of risk assessments across different companies
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
                      placeholder="Search by title, description..."
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
                  <Label htmlFor="risk-level-filter" className="text-sm font-semibold text-gray-700">
                    Risk Type
                  </Label>
                  <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All risk types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Types</SelectItem>
                      {Object.keys(stats.byRiskType).map((riskType) => (
                        <SelectItem key={riskType} value={riskType}>
                          {riskType}
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
                  <Label htmlFor="category-filter" className="text-sm font-semibold text-gray-700">
                    Asset System
                  </Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All asset systems" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Asset Systems</SelectItem>
                      {Object.keys(stats.byAssetSystem).map((assetSystem) => (
                        <SelectItem key={assetSystem} value={assetSystem}>
                          {assetSystem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department-filter" className="text-sm font-semibold text-gray-700">
                    Location
                  </Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {Object.keys(stats.byLocation).map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessments Table */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-red-50 to-indigo-50 border-b border-red-100">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-6 h-6 text-red-600" />
                Risk Assessments ({filteredRiskAssessments.length})
                {companyFilter !== 'all' && (
                  <span className="text-base text-gray-600 font-normal">
                    - {companies.find(c => c.id.toString() === companyFilter)?.name}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {companyFilter === 'all' 
                  ? 'All risk assessments across all companies' 
                  : 'Risk assessments for the selected company'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRiskAssessments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Scope of Work</TableHead>
                        <TableHead>Risk Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Asset System</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Supervisor</TableHead>
                        {companyFilter === 'all' && <TableHead>Company</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRiskAssessments.map((assessment) => (
                                                 <TableRow key={assessment.id}>
                           <TableCell className="font-medium">{assessment.id}</TableCell>
                           <TableCell className="font-medium">{assessment.scopeOfWork}</TableCell>
                           <TableCell>
                             <Badge 
                               variant={
                                 assessment.risks.length > 0 && assessment.risks.some(risk => risk.riskType === 'Personnel') ? 'destructive' : 
                                 assessment.risks.length > 0 && assessment.risks.some(risk => risk.riskType === 'Maintenance') ? 'default' : 
                                 assessment.risks.length > 0 && assessment.risks.some(risk => risk.riskType === 'Revenue') ? 'secondary' : 'outline'
                               }
                             >
                               {assessment.risks.length > 0 ? assessment.risks[0].riskType : 'Unknown'}
                             </Badge>
                           </TableCell>
                           <TableCell>
                             <Badge 
                               variant={
                                 assessment.status === 'active' ? 'default' : 
                                 assessment.status === 'inactive' ? 'secondary' : 
                                 assessment.status === 'completed' ? 'destructive' : 'outline'
                               }
                             >
                               {assessment.status}
                             </Badge>
                           </TableCell>
                           <TableCell>
                             {assessment.assetSystem ? (
                               <Badge variant="outline">{assessment.assetSystem}</Badge>
                             ) : (
                               <span className="text-gray-400">-</span>
                             )}
                           </TableCell>
                           <TableCell>
                             {assessment.location ? (
                               <Badge variant="secondary">{assessment.location}</Badge>
                             ) : (
                               <span className="text-gray-400">-</span>
                             )}
                           </TableCell>
                           <TableCell>
                             {assessment.supervisor ? (
                               <div className="flex items-center gap-2">
                                 <User className="w-4 h-4 text-gray-400" />
                                 {assessment.supervisor}
                               </div>
                             ) : (
                               <span className="text-gray-400">Unknown</span>
                             )}
                           </TableCell>
                          {companyFilter === 'all' && (
                            <TableCell>
                              <Badge variant="outline">
                                {assessment.company?.name || 'Unknown'}
                              </Badge>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Navigate to the risk assessment detail view
                                  router.push(`/risk-assessment/${assessment.id}`);
                                }}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openDeleteDialog(assessment)}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Risk Assessments Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || riskLevelFilter !== 'all' || statusFilter !== 'all' || companyFilter !== 'all' || departmentFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : 'There are no risk assessments available for the selected criteria.'
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
            <DialogTitle>Delete Risk Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this risk assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {riskAssessmentToDelete && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="font-medium block">Risk Assessment Details:</span>
              <span className="text-sm text-gray-600 block">ID: {riskAssessmentToDelete.id}</span>
              <span className="text-sm text-gray-600 block">Scope: {riskAssessmentToDelete.scopeOfWork}</span>
              <span className="text-sm text-gray-600 block">Location: {riskAssessmentToDelete.location}</span>
              <span className="text-sm text-gray-600 block">Date: {new Date(riskAssessmentToDelete.date).toLocaleDateString()}</span>
            </div>
          )}
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
              onClick={handleDeleteRiskAssessment}
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
                  Delete Risk Assessment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
