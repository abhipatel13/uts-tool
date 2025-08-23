"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UniversalUserApi } from "@/services/universalUserApi";
import { RiskAssessmentApi } from "@/services/riskAssessmentApi";

interface RiskAssessment {
  id: string;
  date: string;
  time: string;
  scopeOfWork: string;
  assetSystem: string;
  systemLockoutRequired: boolean;
  trainedWorkforce: boolean;
  risks: {
    id?: string;
    riskDescription: string;
    riskType: string;
    asIsLikelihood: string;
    asIsConsequence: string;
    mitigatingAction: string;
    mitigatedLikelihood: string;
    mitigatedConsequence: string;
    mitigatingActionType: string;
    requiresSupervisorSignature: boolean;
  }[];
  individuals: string;
  supervisor: string;
  status: string;
  location: string;
  createdBy?: string;
  createdOn?: string;
  companyId?: number;
  company?: {
    id: number;
    name: string;
  };
}

interface RiskAssessmentStats {
  total: number;
  byRiskType: Record<string, number>;
  byAssetSystem: Record<string, number>;
  byLocation: Record<string, number>;
  byStatus: Record<string, number>;
  highRiskCount: number;
  pendingApproval: number;
}

export default function RiskAssessmentAnalyticsPage() {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RiskAssessmentStats>({
    total: 0,
    byRiskType: {},
    byAssetSystem: {},
    byLocation: {},
    byStatus: {},
    highRiskCount: 0,
    pendingApproval: 0
  });

  // Filters
  const [riskTypeFilter, setRiskTypeFilter] = useState('all');
  const [assetSystemFilter, setAssetSystemFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  // Calculate statistics
  const calculateStats = useCallback((data: RiskAssessment[], companiesData: { id: number; name: string }[]) => {
    const newStats: RiskAssessmentStats = {
      total: data.length,
      byRiskType: {},
      byAssetSystem: {},
      byLocation: {},
      byStatus: {},
      highRiskCount: 0,
      pendingApproval: 0
    };

    data.forEach(assessment => {
      // Status stats
      newStats.byStatus[assessment.status] = (newStats.byStatus[assessment.status] || 0) + 1;
      
      // Asset System stats
      newStats.byAssetSystem[assessment.assetSystem] = (newStats.byAssetSystem[assessment.assetSystem] || 0) + 1;
      
      // Location stats
      newStats.byLocation[assessment.location] = (newStats.byLocation[assessment.location] || 0) + 1;
      
      // Risk Type stats (from first risk if available)
      if (assessment.risks && assessment.risks.length > 0) {
        const riskType = assessment.risks[0].riskType;
        newStats.byRiskType[riskType] = (newStats.byRiskType[riskType] || 0) + 1;
      }
      
      // High risk count (likelihood 4-5 and consequence 4-5)
      const hasHighRisk = assessment.risks.some(risk => {
        const likelihood = parseInt(risk.asIsLikelihood) || 1;
        const consequence = parseInt(risk.asIsConsequence) || 1;
        return likelihood >= 4 && consequence >= 4;
      });
      if (hasHighRisk) {
        newStats.highRiskCount++;
      }
      
      // Pending approval count
      if (assessment.status === 'pending' || assessment.status === 'Pending') {
        newStats.pendingApproval++;
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

      // Fetch risk assessments using the universal endpoint
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

  // Fetch risk assessments with filters
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
              assessment.companyId === parseInt(companyFilter) || assessment.company?.id === parseInt(companyFilter)
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
  }, [companyFilter, companies, calculateStats]);

  // Apply filters
  const filteredRiskAssessments = riskAssessments.filter(assessment => {
    const matchesRiskType = riskTypeFilter === 'all' || 
      assessment.risks.some(risk => risk.riskType === riskTypeFilter);
    const matchesAssetSystem = assetSystemFilter === 'all' || assessment.assetSystem === assetSystemFilter;
    const matchesLocation = locationFilter === 'all' || assessment.location === locationFilter;
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || 
      assessment.companyId === parseInt(companyFilter) || 
      assessment.company?.id === parseInt(companyFilter);
    const matchesSearch = searchTerm === '' || 
      assessment.scopeOfWork.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.assetSystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.supervisor.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRiskType && matchesAssetSystem && matchesLocation && matchesStatus && matchesCompany && matchesSearch;
  });

  // Get unique values for filter options
  const getUniqueValues = (key: keyof RiskAssessment) => {
    const values = new Set<string>();
    riskAssessments.forEach(assessment => {
      const value = assessment[key];
      if (typeof value === 'string' && value) {
        values.add(value);
      }
    });
    return Array.from(values).sort();
  };

  // Get unique risk types
  const getUniqueRiskTypes = () => {
    const values = new Set<string>();
    riskAssessments.forEach(assessment => {
      assessment.risks.forEach(risk => {
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
    fetchRiskAssessments();
  }, [fetchRiskAssessments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading Risk Assessment Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Risk Assessment Analytics</h1>
        <div className="text-sm text-gray-500">
          Universal Portal - All Companies
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highRiskCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
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
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus['completed'] || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search assessments..."
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
          <CardTitle>Risk Assessments ({filteredRiskAssessments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRiskAssessments.length > 0 ? (
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
                {filteredRiskAssessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium max-w-xs truncate" title={assessment.scopeOfWork}>
                      {assessment.scopeOfWork}
                    </TableCell>
                    <TableCell>{assessment.company?.name || 'N/A'}</TableCell>
                    <TableCell>{assessment.assetSystem}</TableCell>
                    <TableCell>{assessment.location}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assessment.risks && assessment.risks.length > 0 ? assessment.risks[0].riskType : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={assessment.status === 'completed' ? 'default' : 
                               assessment.status === 'active' ? 'secondary' : 
                               assessment.status === 'pending' ? 'destructive' : 'outline'}
                      >
                        {assessment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{assessment.supervisor}</TableCell>
                    <TableCell>{new Date(assessment.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm || riskTypeFilter !== 'all' || assetSystemFilter !== 'all' || locationFilter !== 'all' || statusFilter !== 'all' || companyFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'There are no risk assessments available for the selected criteria.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
