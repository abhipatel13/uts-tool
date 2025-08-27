"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Edit2, Trash2, Users, Building2, Shield, Crown, UserCheck, Plus } from "lucide-react"
// import Image from "next/image"
import { UniversalUserApi } from "@/services/universalUserApi"
import { TaskHazardApi } from "@/services/taskHazardApi"
import { User } from "@/types/user"
import { UserDialog } from "@/components/universal/UserDialog"
import Link from "next/link"
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

interface NewCompany {
  name: string;
  description?: string;
}

interface UserStats {
  universalUsers: number;
  superusers: number;
  admins: number;
  supervisors: number;
  users: number;
  totalCompanies: number;
}

export default function UniversalPortal() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [taskHazardCount, setTaskHazardCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    universalUsers: 0,
    superusers: 0,
    admins: 0,
    supervisors: 0,
    users: 0,
    totalCompanies: 0
  });
  
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreateCompanyDialogOpen, setIsCreateCompanyDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteCompanyDialogOpen, setIsDeleteCompanyDialogOpen] = useState(false);
  
  const [newCompany, setNewCompany] = useState<NewCompany>({
    name: '',
    description: ''
  });
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editCompanyFormData, setEditCompanyFormData] = useState<Partial<NewCompany>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Company filter state for the prominent filter
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const { toast } = useToast();
  const router = useRouter();

  // Reset edit form when dialog opens/closes
  useEffect(() => {
    if (!isEditDialogOpen) {
      setSelectedUser(null);
    }
  }, [isEditDialogOpen]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResponse, companiesResponse] = await Promise.all([
        UniversalUserApi.getAllUsers({}), // Initial load - get all users
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
        description: "Failed to fetch portal data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const params: { company_id?: number } = {};
      
      // Apply company filter
      if (selectedCompanyFilter !== 'all') {
        params.company_id = parseInt(selectedCompanyFilter);
      }
      
      const response = await UniversalUserApi.getAllUsers(params);
      if (response.status && response.data.users) {
        setUsers(response.data.users);
        setTotalUsers(response.data.pagination.totalUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [selectedCompanyFilter]);

  const fetchCompanies = async () => {
    try {
      const response = await UniversalUserApi.getAllCompanies();
      if (response.status) {
        const companiesData = response.data;
        setCompanies(companiesData);
        calculateStats(users, companiesData);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchTaskHazards = useCallback(async () => {
    try {
      // Use the new company-based API for universal users
      const response = await TaskHazardApi.getByCompany(selectedCompanyFilter);
      if (response.status && response.data) {
        setTaskHazardCount(response.pagination.totalItems);
      }
    } catch (error) {
      console.error('Error fetching task hazards:', error);
      // Fallback to the original API if the new one fails
      try {
        const fallbackResponse = await TaskHazardApi.getTaskHazards({
          limit: 1000,
        });
        if (fallbackResponse.status && fallbackResponse.data) {
          let taskHazardsData = fallbackResponse.data;
          
          // Filter manually if a specific company is selected
          if (selectedCompanyFilter !== 'all') {
            setCompanies(currentCompanies => {
              const selectedCompany = currentCompanies.find(c => c.id.toString() === selectedCompanyFilter);
              if (selectedCompany) {
                taskHazardsData = fallbackResponse.data.filter(taskHazard => 
                  taskHazard.companyId === selectedCompany.id
                );
              }
              return currentCompanies; // Return unchanged
            });
          }
          
          setTaskHazardCount(taskHazardsData.length);
        }
      } catch (fallbackError) {
        console.error('Error with fallback task hazard fetching:', fallbackError);
      }
    }
  }, [selectedCompanyFilter]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Fetch users and task hazards when company filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchTaskHazards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyFilter, isAuthenticated]);

  const calculateStats = (usersList: User[], companiesList: Company[]) => {
    
    const newStats: UserStats = {
      universalUsers: usersList.filter(u => u.role === 'universal_user').length,
      superusers: usersList.filter(u => u.role === 'superuser').length,
      admins: usersList.filter(u => u.role === 'admin').length,
      supervisors: usersList.filter(u => u.role === 'supervisor').length,
      users: usersList.filter(u => u.role === 'user').length,
      totalCompanies: companiesList.length
    };
    
    setStats(newStats);
  };

  // Calculate stats whenever data changes
  useEffect(() => {
    calculateStats(users, companies);
  }, [users, companies]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await UniversalUserApi.createCompany(newCompany);
      if (response.status) {
        toast({
          title: "Success",
          description: "Company created successfully",
        });
        setIsCreateCompanyDialogOpen(false);
        setNewCompany({
          name: '',
          description: ''
        });
        fetchCompanies();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create company",
        variant: "destructive",
      });
    }
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      const response = await UniversalUserApi.updateCompany(selectedCompany.id, editCompanyFormData);
      if (response.status) {
        toast({
          title: "Success",
          description: "Company updated successfully",
        });
        setIsEditCompanyDialogOpen(false);
        fetchCompanies();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update company",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await UniversalUserApi.deleteUser(selectedUser.id);
      if (response.status) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;

    try {
      const response = await UniversalUserApi.deleteCompany(selectedCompany.id);
      if (response.status) {
        toast({
          title: "Success",
          description: "Company deleted successfully",
        });
        setIsDeleteCompanyDialogOpen(false);
        setSelectedCompany(null);
        fetchCompanies();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const openEditCompanyDialog = (company: Company) => {
    setSelectedCompany(company);
    setEditCompanyFormData({
      name: company.name || '',
      description: company.description || ''
    });
    setIsEditCompanyDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openDeleteCompanyDialog = (company: Company) => {
    setSelectedCompany(company);
    setIsDeleteCompanyDialogOpen(true);
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Universal Portal...</p>
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
          {/* Company Filter Section */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
            </div>
              <div>
                    <h3 className="text-xl font-bold text-gray-900">Company Filter</h3>
                    <p className="text-sm text-gray-600 mt-1">Select a specific company or view data from all companies</p>
              </div>
              </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-left sm:text-right">
                    <Label htmlFor="company-filter" className="text-sm font-semibold text-gray-700 block mb-2">
                      Filter by Company
                    </Label>
                    <Select 
                      value={selectedCompanyFilter} 
                      onValueChange={setSelectedCompanyFilter}
                    >
                      <SelectTrigger className="w-72 h-11 border-2 border-blue-200 focus:border-blue-500 bg-white shadow-sm">
                        <SelectValue placeholder="Select company..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="all" className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            All Companies
            </div>
                        </SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              {company.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
                  <div className="text-sm">
                    {selectedCompanyFilter === 'all' ? (
                      <span className="text-gray-700">
                        <span className="font-semibold text-blue-600">{companies.length} companies</span> - Viewing data from all companies
                      </span>
                    ) : companies.find(c => c.id.toString() === selectedCompanyFilter) && (
                      <span className="text-gray-700">
                        Currently filtering data for: <span className="font-semibold text-blue-600">{companies.find(c => c.id.toString() === selectedCompanyFilter)?.name}</span>
                      </span>
                    )}
          </div>
        </div>
      </div>
            
            {selectedCompanyFilter !== 'all' && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-sm font-medium text-blue-800">
                    🔍 Filtered View: All data below shows results for {companies.find(c => c.id.toString() === selectedCompanyFilter)?.name}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
            <p className="text-gray-600">Real-time statistics across your system</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
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
                <Users className="w-8 h-8 text-gray-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Companies</p>
                  <p className="text-2xl font-bold">{stats.totalCompanies}</p>
                </div>
                <Building2 className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>



          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Task Hazards</p>
                  <p className="text-2xl font-bold">{taskHazardCount}</p>
                </div>
                <Shield className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Main Content Container */}
        <div>
          {/* User Management Section */}
          <>
                        {/* User Management Header */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">User Management</h2>
                      <p className="text-gray-600 mt-1">Manage user accounts and roles across the platform</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
            <Dialog open={isCreateCompanyDialogOpen} onOpenChange={setIsCreateCompanyDialogOpen}>
              <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                  <Building2 className="w-4 h-4 mr-2" />
                          Add Company
                        </Button>
              </DialogTrigger>
                      <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCompany} className="space-y-4">
                  <div>
                            <Label htmlFor="company-name">Company Name</Label>
                    <Input
                              id="company-name"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                            <Label htmlFor="company-description">Description</Label>
                    <Input
                              id="company-description"
                              value={newCompany.description}
                      onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                    />
                  </div>
                          <Button type="submit">Create Company</Button>
                </form>
              </DialogContent>
            </Dialog>
                <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
                <Link href="/universal-portal/users/bulk-upload">
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                </Link>
                    </div>
                  </div>

                {/* Search and Filter Controls */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                      <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
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

        {/* Users Table */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Users ({filteredUsers.length})
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage user accounts and their roles across the platform
                    </CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Department</TableHead>
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
                      <TableCell>
                              <div className="flex gap-2">
                                <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                                </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>

        {/* Companies Table */}
                <Card className="mt-8 shadow-lg border-0 bg-white">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-orange-600" />
                      Companies ({filteredCompanies.length})
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage companies and organizations
                    </CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                          <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                          <TableHead>Users</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                        {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>{company.description || 'N/A'}</TableCell>
                      <TableCell>
                              <Badge variant="secondary">
                                {users.filter(u => u.company?.id === company.id).length} users
                              </Badge>
                      </TableCell>
                            <TableCell>{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                              <div className="flex gap-2">
                                <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCompanyDialog(company)}
                          >
                            <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteCompanyDialog(company)}
                          >
                            <Trash2 className="w-4 h-4" />
                                </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>

        
        

        <UserDialog 
          isOpen={isCreateUserDialogOpen}
          onOpenChange={setIsCreateUserDialogOpen}
          companies={companies}
          onSaved={() => {
            fetchUsers();
          }}
        />
        <UserDialog 
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          companies={companies}
          user={selectedUser || undefined}
          onSaved={() => {
            fetchUsers();
          }}
        />


        {/* Edit Company Dialog */}
        <Dialog open={isEditCompanyDialogOpen} onOpenChange={setIsEditCompanyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditCompany} className="space-y-4">
              <div>
                <Label htmlFor="edit-company-name">Company Name</Label>
                <Input
                  id="edit-company-name"
                  value={editCompanyFormData.name || ''}
                  onChange={(e) => setEditCompanyFormData({...editCompanyFormData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-company-description">Description</Label>
                <Input
                  id="edit-company-description"
                  value={editCompanyFormData.description || ''}
                  onChange={(e) => setEditCompanyFormData({...editCompanyFormData, description: e.target.value})}
                />
              </div>
              <Button type="submit">Update Company</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete {selectedUser?.name || selectedUser?.email}? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete
              </Button>
              </div>
          </DialogContent>
        </Dialog>

        {/* Delete Company Dialog */}
        <Dialog open={isDeleteCompanyDialogOpen} onOpenChange={setIsDeleteCompanyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete {selectedCompany?.name}? This action cannot be undone and will affect all users in this company.</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDeleteCompanyDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCompany}>
                Delete
              </Button>
                </div>
          </DialogContent>
        </Dialog>
          </>

          </div>
        </div>
      </div>
    </div>
  );
} 
