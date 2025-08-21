"use client"

import { CommonButton } from "@/components/ui/common-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Edit2, Trash2, Plus, Users, Building2, Shield, Crown, UserCheck } from "lucide-react"
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
  company_id?: number;
  department?: string;
  business_unit?: string;
  plant?: string;
  createdAt?: string;
}

interface Company {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NewUser {
  email: string;
  password: string;
  role: string;
  company_id?: number;
  name?: string;
  department?: string;
  business_unit?: string;
  plant?: string;
}

interface NewCompany {
  name: string;
  description?: string;
}

interface UserStats {
  totalUsers: number;
  universalUsers: number;
  superusers: number;
  admins: number;
  supervisors: number;
  users: number;
  totalCompanies: number;
}

export default function UniversalPortal() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [editCompanyFormData, setEditCompanyFormData] = useState<Partial<Company>>({});
  
  const [newUser, setNewUser] = useState<NewUser>({ 
    email: '', 
    password: '', 
    role: 'user',
    name: '',
    department: '',
    business_unit: '',
    plant: ''
  });
  
  const [newCompany, setNewCompany] = useState<NewCompany>({
    name: '',
    description: ''
  });
  
  // Company filter state for the prominent filter
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const { toast } = useToast();
  const router = useRouter();

  // Reset edit form when dialog opens/closes
  useEffect(() => {
    if (!isEditDialogOpen) {
      setEditFormData({});
      setSelectedUser(null);
    }
  }, [isEditDialogOpen]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { company_id?: number } = {};
      
      // Apply company filter
      if (selectedCompanyFilter !== 'all') {
        params.company_id = parseInt(selectedCompanyFilter);
      }
      
      const [usersResponse, companiesResponse] = await Promise.all([
        UniversalUserApi.getAllUsers(params),
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
  }, [selectedCompanyFilter, toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const params: { company_id?: number } = {};
      
      // Apply company filter
      if (selectedCompanyFilter !== 'all') {
        params.company_id = parseInt(selectedCompanyFilter);
      }
      
      const response = await UniversalUserApi.getAllUsers(params);
      if (response.status && response.data.users) {
        const usersData = response.data.users;
        setUsers(usersData);
        calculateStats(usersData, companies);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [selectedCompanyFilter, companies]);

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

  // Authentication and initial data loading
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setLoading(false);
        return false;
      }
      
      const user = JSON.parse(userData);
      if (user.role !== 'universal_user') {
        setLoading(false);
        return false;
      }
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    };

    if (checkAuth()) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [router, fetchData]);

  // Fetch users when company filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [selectedCompanyFilter, isAuthenticated, fetchUsers]);

  const calculateStats = (usersList: User[], companiesList: Company[]) => {
    
    const newStats: UserStats = {
      totalUsers: usersList.length,
      universalUsers: usersList.filter(u => u.role === 'universal_user').length,
      superusers: usersList.filter(u => u.role === 'superuser').length,
      admins: usersList.filter(u => u.role === 'admin').length,
      supervisors: usersList.filter(u => u.role === 'supervisor').length,
      users: usersList.filter(u => u.role === 'user').length,
      totalCompanies: companiesList.length
    };
    
    setStats(newStats);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await UniversalUserApi.createUser(newUser);
      if (response.status) {
        toast({
          title: "Success",
          description: "User created successfully",
        });
        setIsCreateUserDialogOpen(false);
        setNewUser({ 
          email: '', 
          password: '', 
          role: 'user',
          name: '',
          department: '',
          business_unit: '',
          plant: ''
        });
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

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
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create company",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await UniversalUserApi.updateUser(selectedUser.id, editFormData);
      if (response.status) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        setEditFormData({});
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
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
        setSelectedCompany(null);
        setEditCompanyFormData({});
        fetchCompanies();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update company",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await UniversalUserApi.deleteUser(userToDelete.id);
      if (response.status) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const openDeleteCompanyDialog = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteCompanyDialogOpen(true);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      const response = await UniversalUserApi.deleteCompany(companyToDelete.id);
      if (response.status) {
        toast({
          title: "Success",
          description: "Company deleted successfully",
        });
        setIsDeleteCompanyDialogOpen(false);
        setCompanyToDelete(null);
        fetchCompanies();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete company",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    
    const formData = {
      email: user.email,
      name: user.name || '',
      role: user.role,
      company_id: user.company_id,
      department: user.department || '',
      business_unit: user.business_unit || '',
      plant: user.plant || ''
    };
        
    setSelectedUser(user);
    setEditFormData(formData);
    setIsEditDialogOpen(true);
  };

  const openEditCompanyDialog = (company: Company) => {
    
    const formData = {
      name: company.name,
      description: company.description || ''
    };
    
    setSelectedCompany(company);
    setEditCompanyFormData(formData);
    setIsEditCompanyDialogOpen(true);
  };



  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'universal_user': return 'destructive';
      case 'superuser': return 'secondary';
      case 'admin': return 'default';
      case 'supervisor': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'universal_user': return <Crown className="w-4 h-4" />;
      case 'superuser': return <Shield className="w-4 h-4" />;
      case 'admin': return <Users className="w-4 h-4" />;
      case 'supervisor': return <UserCheck className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();
      
      if (data.status && data.data.role === 'universal_user') {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        
        // Also set cookies for middleware access
        document.cookie = `token=${data.data.token}; path=/`;
        document.cookie = `user=${JSON.stringify(data.data)}; path=/`;
        
        setCurrentUser(data.data);
        fetchData();
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials or insufficient permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Universal Portal...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <Crown className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Universal Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              System Administration & User Management
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  placeholder="universal@utahtech.edu"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <CommonButton
                type="submit"
                className="w-full bg-[#34495E] hover:bg-[#34495E]/90"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing in...' : 'Sign in to Universal Portal'}
              </CommonButton>
            </div>
          </form>
          
          <div className="text-center text-sm text-gray-600">
            <p>Default credentials:</p>
            <p className="font-mono text-xs mt-1">
              Email: universal@utahtech.edu<br/>
              Password: UniversalAdmin2024!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Filter - Prominent Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-blue-900 flex items-center gap-3">
              <Building2 className="w-6 h-6" />
              Company Filter
            </CardTitle>
            <CardDescription className="text-blue-700">
              Select a company to view its data across all modules, or choose &quot;All Companies&quot; for universal access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
              <div className="lg:col-span-2">
                <label className="block text-lg font-semibold text-blue-900 mb-3">
                  Select Company
                </label>
                <Select 
                  value={selectedCompanyFilter} 
                  onValueChange={setSelectedCompanyFilter}
                >
                  <SelectTrigger className="h-14 text-lg border-2 border-blue-300 bg-white hover:border-blue-400 focus:border-blue-500">
                    <SelectValue placeholder="Choose a company..." className="text-lg" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="all" className="text-lg py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-semibold">All Companies</span>
                        <span className="text-sm text-gray-500">(Universal Access)</span>
                      </div>
                    </SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()} className="text-lg py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>{company.name}</span>
                          <span className="text-sm text-gray-500">ID: {company.id}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-3">
                <div className="text-sm text-blue-700 font-medium">
                  Currently Viewing:
                </div>
                <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                  {selectedCompanyFilter === 'all' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="font-bold text-green-700">All Companies</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-bold text-blue-700">
                        {companies.find(c => c.id.toString() === selectedCompanyFilter)?.name || 'Select Company'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {selectedCompanyFilter !== 'all' && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-sm font-medium">
                    All data shown below is filtered for: {companies.find(c => c.id.toString() === selectedCompanyFilter)?.name}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Users</p>
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
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <div className="flex space-x-3">
            <Dialog open={isCreateCompanyDialogOpen} onOpenChange={setIsCreateCompanyDialogOpen}>
              <DialogTrigger asChild>
                <CommonButton variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                  <Building2 className="w-4 h-4 mr-2" />
                  Create Company
                </CommonButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCompany} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name *</label>
                    <Input
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                      value={newCompany.description || ''}
                      onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                      placeholder="Optional company description"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <CommonButton type="button" variant="outline" onClick={() => setIsCreateCompanyDialogOpen(false)}>
                      Cancel
                    </CommonButton>
                    <CommonButton type="submit" className="bg-[#34495E] hover:bg-[#34495E]/90">
                      Create Company
                    </CommonButton>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
              <DialogTrigger asChild>
                <CommonButton className="bg-[#34495E] hover:bg-[#34495E]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </CommonButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password *</label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Role *</label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="universal_user">Universal User</SelectItem>
                          <SelectItem value="superuser">Superuser</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Company</label>
                      <Select 
                        value={newUser.company_id?.toString() || ''} 
                        onValueChange={(value) => setNewUser({...newUser, company_id: value ? parseInt(value) : undefined})}
                        disabled={newUser.role === 'universal_user'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={newUser.role === 'universal_user' ? 'N/A (Universal)' : 'Select company'} />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input
                        value={newUser.name || ''}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Department</label>
                      <Input
                        value={newUser.department || ''}
                        onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Unit</label>
                      <Input
                        value={newUser.business_unit || ''}
                        onChange={(e) => setNewUser({...newUser, business_unit: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Plant</label>
                      <Input
                        value={newUser.plant || ''}
                        onChange={(e) => setNewUser({...newUser, plant: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <CommonButton type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                      Cancel
                    </CommonButton>
                    <CommonButton type="submit" className="bg-[#34495E] hover:bg-[#34495E]/90">
                      Create User
                    </CommonButton>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
            <CardDescription>View and manage all users across all companies and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || user.email}</div>
                          {user.name && <div className="text-sm text-gray-500">{user.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(user.role)}
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === 'universal_user' ? (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            All Companies
                          </Badge>
                        ) : (
                          user.company?.name || 'N/A'
                        )}
                      </TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <CommonButton
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </CommonButton>
                          <CommonButton
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            disabled={user.id === currentUser?.id}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </CommonButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>All Companies ({companies.length})</CardTitle>
            <CardDescription>View and manage all companies in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 rounded-full">
                            <Building2 className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-gray-500">ID: {company.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.description || '-'}
                      </TableCell>
                      <TableCell>
                        {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <CommonButton
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCompanyDialog(company)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </CommonButton>
                          <CommonButton
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteCompanyDialog(company)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </CommonButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="Enter name"
                  />
                  <div className="text-xs text-gray-500 mt-1">Debug: {editFormData.name || 'empty'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Select 
                    value={editFormData.role || ''} 
                    onValueChange={(value) => setEditFormData({...editFormData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="universal_user">Universal User</SelectItem>
                      <SelectItem value="superuser">Superuser</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <Select 
                    value={editFormData.company_id?.toString() || ''} 
                    onValueChange={(value) => setEditFormData({...editFormData, company_id: value ? parseInt(value) : undefined})}
                    disabled={editFormData.role === 'universal_user'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={editFormData.role === 'universal_user' ? 'N/A (Universal)' : 'Select company'} />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <Input
                    value={editFormData.department || ''}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Business Unit</label>
                  <Input
                    value={editFormData.business_unit || ''}
                    onChange={(e) => setEditFormData({...editFormData, business_unit: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Plant</label>
                <Input
                  value={editFormData.plant || ''}
                  onChange={(e) => setEditFormData({...editFormData, plant: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <CommonButton type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </CommonButton>
                <CommonButton type="submit" className="bg-[#34495E] hover:bg-[#34495E]/90">
                  Update User
                </CommonButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Are you sure you want to delete this user?
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              {userToDelete && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {userToDelete.name || userToDelete.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        {userToDelete.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={getRoleBadgeVariant(userToDelete.role)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(userToDelete.role)}
                          {userToDelete.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {userToDelete.company && (
                          <span className="text-sm text-gray-500">
                            • {userToDelete.company.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <CommonButton 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setUserToDelete(null);
                  }}
                >
                  Cancel
                </CommonButton>
                <CommonButton 
                  type="button" 
                  onClick={handleDeleteUser}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete User
                </CommonButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Company Dialog */}
        <Dialog open={isEditCompanyDialogOpen} onOpenChange={setIsEditCompanyDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <Input
                  value={editCompanyFormData.name || ''}
                  onChange={(e) => setEditCompanyFormData({...editCompanyFormData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={editCompanyFormData.description || ''}
                  onChange={(e) => setEditCompanyFormData({...editCompanyFormData, description: e.target.value})}
                  placeholder="Optional company description"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <CommonButton type="button" variant="outline" onClick={() => setIsEditCompanyDialogOpen(false)}>
                  Cancel
                </CommonButton>
                <CommonButton type="submit" className="bg-[#34495E] hover:bg-[#34495E]/90">
                  Update Company
                </CommonButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Company Confirmation Dialog */}
        <Dialog open={isDeleteCompanyDialogOpen} onOpenChange={setIsDeleteCompanyDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Are you sure you want to delete this company?
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    This action cannot be undone and will affect all users in this company.
                  </p>
                </div>
              </div>
              
              {companyToDelete && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {companyToDelete.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ID: {companyToDelete.id}
                      </p>
                      {companyToDelete.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {companyToDelete.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <CommonButton 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDeleteCompanyDialogOpen(false);
                    setCompanyToDelete(null);
                  }}
                >
                  Cancel
                </CommonButton>
                <CommonButton 
                  type="button" 
                  onClick={handleDeleteCompany}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Company
                </CommonButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 