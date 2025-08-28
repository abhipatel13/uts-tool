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
import { Search, Filter, Building2, Users, Calendar, Mail, Phone } from "lucide-react"
import { UniversalUserApi } from "@/services/universalUserApi"

interface User {
  id: string | number;
  email: string;
  name?: string;
  role: string;
  company?: {
    id?: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };
  company_id?: number;
  phone?: string;
  joiningDate?: string;
  department?: string;
}

interface Company {
  id: number;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  userCount?: number;
  createdAt?: string;
}

interface CompanyStats {
  totalCompanies: number;
  totalUsers: number;
  averageUsersPerCompany: number;
  companiesWithUsers: number;
  companiesWithoutUsers: number;
}

export default function UniversalCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CompanyStats>({
    totalCompanies: 0,
    totalUsers: 0,
    averageUsersPerCompany: 0,
    companiesWithUsers: 0,
    companiesWithoutUsers: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [companiesResponse, usersResponse] = await Promise.all([
        UniversalUserApi.getAllCompanies(),
        UniversalUserApi.getAllUsers({})
      ]);
      
      if (companiesResponse.status && usersResponse.status) {
        const companiesData = companiesResponse.data || [];
        const usersData = usersResponse.data.users || [];
        
        // Calculate user count for each company
        const companiesWithUserCount = companiesData.map(company => ({
          ...company,
          userCount: usersData.filter(user => 
            (user.company?.id && user.company.id === company.id) || user.company_id === company.id
          ).length
        }));
        
        setCompanies(companiesWithUserCount);

        calculateStats(companiesWithUserCount, usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch company data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

  const calculateStats = (companiesList: Company[], usersList: User[]) => {
    const totalCompanies = companiesList.length;
    const totalUsers = usersList.length;
    const averageUsersPerCompany = totalCompanies > 0 ? Math.round(totalUsers / totalCompanies) : 0;
    const companiesWithUsers = companiesList.filter(c => (c.userCount || 0) > 0).length;
    const companiesWithoutUsers = totalCompanies - companiesWithUsers;
    
    setStats({
      totalCompanies,
      totalUsers,
      averageUsersPerCompany,
      companiesWithUsers,
      companiesWithoutUsers
    });
  };

  // Sort and filter functions
  const filteredAndSortedCompanies = companies
    .filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | number | undefined = a[sortBy as keyof Company];
      let bValue: string | number | undefined = b[sortBy as keyof Company];
      
      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';
      
      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Companies...</p>
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
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Company Management</h1>
                <p className="text-gray-600 mt-1">Manage companies and organizations across the platform</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Companies</p>
                    <p className="text-2xl font-bold">{stats.totalCompanies}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Avg Users/Company</p>
                    <p className="text-2xl font-bold">{stats.averageUsersPerCompany}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">With Users</p>
                    <p className="text-2xl font-bold">{stats.companiesWithUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-100 text-sm">Without Users</p>
                    <p className="text-2xl font-bold">{stats.companiesWithoutUsers}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-gray-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                Search & Sort
              </CardTitle>
              <CardDescription className="text-gray-600">
                Find and organize companies
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-semibold text-gray-700">
                    Search
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search by name, description, or contact info..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sort-by" className="text-sm font-semibold text-gray-700">
                    Sort By
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Company Name</SelectItem>
                        <SelectItem value="userCount">User Count</SelectItem>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Companies Table */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                Companies ({filteredAndSortedCompanies.length})
              </CardTitle>
              <CardDescription className="text-gray-600">
                All companies and organizations in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAndSortedCompanies.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            Company Name
                            {sortBy === 'name' && (
                              <span className="text-gray-400">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('userCount')}
                        >
                          <div className="flex items-center gap-2">
                            Users
                            {sortBy === 'userCount' && (
                              <span className="text-gray-400">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center gap-2">
                            Created
                            {sortBy === 'createdAt' && (
                              <span className="text-gray-400">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedCompanies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="max-w-xs">
                            <span className="truncate block" title={company.description}>
                              {company.description || 'No description'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {company.userCount || 0} users
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {company.contactEmail && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <span className="truncate max-w-32" title={company.contactEmail}>
                                    {company.contactEmail}
                                  </span>
                                </div>
                              )}
                              {company.contactPhone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span>{company.contactPhone}</span>
                                </div>
                              )}
                              {!company.contactEmail && !company.contactPhone && (
                                <span className="text-gray-400 text-sm">No contact info</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Navigate to company detail view
                                router.push(`/universal-portal/companies/${company.id}`);
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
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
                  <p className="text-gray-500">
                    {searchTerm
                      ? 'Try adjusting your search terms.'
                      : 'There are no companies available.'
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
