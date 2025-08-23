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
import { Search, Filter, Users, Building2, Crown, Shield, UserCheck, User } from "lucide-react"
import { UniversalUserApi } from "@/services/universalUserApi"

interface User {
  id: string | number;
  email: string;
  name?: string;
  role: string;
  company?: {
    id: number;
    name: string;
  };
  companyId?: number;
  phone?: string;
  joiningDate?: string;
  department?: string;
}

interface Company {
  id: number;
  name: string;
}

interface UserStats {
  totalUsers: number;
  universalUsers: number;
  superusers: number;
  admins: number;
  supervisors: number;
  users: number;
  byCompany: { [key: string]: number };
}

export default function UniversalUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    universalUsers: 0,
    superusers: 0,
    admins: 0,
    supervisors: 0,
    users: 0,
    byCompany: {}
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResponse, companiesResponse] = await Promise.all([
        UniversalUserApi.getAllUsers({}),
        UniversalUserApi.getAllCompanies()
      ]);
      
      if (usersResponse.status && companiesResponse.status) {
        const usersData = usersResponse.data.users || [];
        const companiesData = companiesResponse.data || [];
        
        setUsers(usersData);
        setCompanies(companiesData);
        calculateStats(usersData, companiesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const params: { company_id?: number } = {};
      
      if (companyFilter !== 'all') {
        params.company_id = parseInt(companyFilter);
      }
      
      const response = await UniversalUserApi.getAllUsers(params);
      if (response.status && response.data.users) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [companyFilter]);

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

  // Fetch users when company filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [companyFilter, isAuthenticated, fetchUsers]);

  const calculateStats = (usersList: User[], companiesList: Company[]) => {
    const newStats: UserStats = {
      totalUsers: usersList.length,
      universalUsers: usersList.filter(u => u.role === 'universal_user').length,
      superusers: usersList.filter(u => u.role === 'superuser').length,
      admins: usersList.filter(u => u.role === 'admin').length,
      supervisors: usersList.filter(u => u.role === 'supervisor').length,
      users: usersList.filter(u => u.role === 'user').length,
      byCompany: {}
    };
    
    // Calculate stats by company
    companiesList.forEach(company => {
      newStats.byCompany[company.name] = usersList.filter(u => 
        u.company?.id === company.id || u.companyId === company.id
      ).length;
    });
    
    setStats(newStats);
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Users...</p>
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
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage user accounts and roles across all companies</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Universal</p>
                    <p className="text-2xl font-bold">{stats.universalUsers}</p>
                  </div>
                  <Crown className="w-8 h-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Superusers</p>
                    <p className="text-2xl font-bold">{stats.superusers}</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Admins</p>
                    <p className="text-2xl font-bold">{stats.admins}</p>
                  </div>
                  <Users className="w-8 h-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Supervisors</p>
                    <p className="text-2xl font-bold">{stats.supervisors}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-100 text-sm">Users</p>
                    <p className="text-2xl font-bold">{stats.users}</p>
                  </div>
                  <User className="w-8 h-8 text-gray-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Companies</p>
                    <p className="text-2xl font-bold">{companies.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-orange-200" />
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
                  Users by Company
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Distribution of users across different companies
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-semibold text-gray-700">
                    Search
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search by name or email..."
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
                  <Label htmlFor="role-filter" className="text-sm font-semibold text-gray-700">
                    Role
                  </Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="universal_user">Universal User</SelectItem>
                      <SelectItem value="superuser">Superuser</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Users ({filteredUsers.length})
                {companyFilter !== 'all' && (
                  <span className="text-base text-gray-600 font-normal">
                    - {companies.find(c => c.id.toString() === companyFilter)?.name}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {companyFilter === 'all' 
                  ? 'All users across all companies' 
                  : 'Users for the selected company'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                user.role === 'universal_user' ? 'destructive' :
                                user.role === 'superuser' ? 'secondary' :
                                user.role === 'admin' ? 'default' :
                                'outline'
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.company?.name || 'No Company'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.department || 'N/A'}</TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Navigate to user detail view or edit
                                router.push(`/universal-portal/users/${user.id}`);
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
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || roleFilter !== 'all' || companyFilter !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : 'There are no users available for the selected criteria.'
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
