"use client"

import { CommonButton } from "@/components/ui/common-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast";
import { UserApi } from "@/services";
import { User } from '@/types/user';
import Link from "next/link"
import { Plus } from "lucide-react"

interface NewUser {
  email: string;
  password: string;
  role: string;
  company: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUniversalUser, setIsUniversalUser] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({ 
    email: '', 
    password: '', 
    role: 'user',
    company: ''
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({ 
    email: '', 
    role: '', 
    name: '' 
  });
  const [passwordFormData, setPasswordFormData] = useState({ 
    newPassword: '', 
    confirmPassword: '' 
  });
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await UserApi.getAll();
        if (response.status) {
          setUsers(response.data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setIsUniversalUser(user.role === 'universal_user');
          
          // Only superusers can access this admin page
          // Universal users should use the Universal Portal users page instead
          if (user.role !== 'superuser') {
            if (user.role === 'universal_user') {
              router.push('/universal-portal/users');
              return;
            } else {
              setError('Access denied. Only superusers can access this admin page.');
              return;
            }
          }
          
          // Set the company in newUser state when current user is loaded
          setNewUser({ 
            email: '', 
            password: '', 
            role: user.role === 'universal_user' ? 'superuser' : 'user', // Universal users default to creating superusers
            company: typeof user.company === 'string' 
              ? user.company 
              : (user.company && typeof user.company === 'object' && 'name' in user.company)
                ? user.company.name 
                : '' 
          });
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchUsers();
    fetchCurrentUser();
  }, [toast]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional validation: Universal users can only create superusers
    if (currentUser?.role === 'universal_user' && newUser.role !== 'superuser') {
      toast({
        title: "Error",
        description: "Universal users can only create Superuser accounts",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Ensure company is set from current user
      const userToCreate = {
        ...newUser,
        company: typeof currentUser?.company === 'string' 
          ? currentUser.company 
          : (currentUser?.company && typeof currentUser.company === 'object' && 'name' in currentUser.company)
            ? currentUser.company.name 
            : ''
      };

      const response = await UserApi.create(userToCreate);
      if (response.status) {
        toast({
          title: "Success",
          description: "User created successfully",
        });
        setIsCreateDialogOpen(false);
        setNewUser({ 
          email: '', 
          password: '', 
          role: currentUser?.role === 'universal_user' ? 'superuser' : 'user', // Universal users default to creating superusers
          company: typeof currentUser?.company === 'string' 
          ? currentUser.company 
          : (currentUser?.company && typeof currentUser.company === 'object' && 'name' in currentUser.company)
            ? currentUser.company.name 
            : '' 
        });
        // Refresh the users list
        const updatedResponse = await UserApi.getAll();
        if (updatedResponse.status) {
          setUsers(updatedResponse.data);
        }
      }
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      
      // Handle validation errors from backend
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { data?: { errors?: Array<{ field: string; message: string }>, message?: string } } };
        
        if (responseError.response?.data?.errors) {
          const validationErrors = responseError.response.data.errors;
          const errorMessages = validationErrors.map((err) => {
            if (err.field === 'email') {
              return "Please enter a valid email address";
            }
            return err.message || "Validation error";
          });
          
          toast({
            title: "Validation Error",
            description: errorMessages.join(", "),
            variant: "destructive",
          });
        } else if (responseError.response?.data?.message) {
          toast({
            title: "Error",
            description: responseError.response.data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create user",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create user",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await UserApi.delete(userId);
      if (response.status) {
        setUsers(users.filter(user => user.id.toString() !== userId));
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email,
      role: user.role,
      name: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const response = await UserApi.update(selectedUser.id.toString(), {
        email: editFormData.email,
        role: editFormData.role
      });

      if (response.status) {
        // Update the user in the local state
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { ...user, email: editFormData.email, role: editFormData.role }
            : user
        ));

        setIsEditDialogOpen(false);
        setSelectedUser(null);
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      }
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      
      // Handle validation errors from backend
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { data?: { errors?: Array<{ field: string; message: string }>, message?: string } } };
        
        if (responseError.response?.data?.errors) {
          const validationErrors = responseError.response.data.errors;
          const errorMessages = validationErrors.map((err) => {
            if (err.field === 'email') {
              return "Please enter a valid email address";
            }
            return err.message || "Validation error";
          });
          
          toast({
            title: "Validation Error",
            description: errorMessages.join(", "),
            variant: "destructive",
          });
        } else if (responseError.response?.data?.message) {
          toast({
            title: "Error",
            description: responseError.response.data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update user",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update user",
          variant: "destructive",
        });
      }
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordFormData({ newPassword: '', confirmPassword: '' });
    setIsPasswordDialogOpen(true);
  };

  const handleSavePassword = async () => {
    if (!selectedUser) return;

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await UserApi.resetPassword(selectedUser.id.toString(), passwordFormData.newPassword);
      
      if (response.status) {
        setIsPasswordDialogOpen(false);
        setSelectedUser(null);
        toast({
          title: "Success",
          description: "Password reset successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600">
            {currentUser?.company && typeof currentUser.company === 'object' && 'name' in currentUser.company
              ? `Manage users for ${currentUser.company.name}`
              : currentUser?.company && typeof currentUser.company === 'string'
                ? `Manage users for ${currentUser.company}`
                : 'Manage users for your company'
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/configurations/admin/users/bulk-upload">
            <CommonButton variant="info">
              <Plus className="w-4 h-4 mr-2" />
              Bulk Upload
            </CommonButton>
          </Link>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <CommonButton>
                Create New User
              </CommonButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {(isUniversalUser || currentUser?.role === 'universal_user') ? (
                        <SelectItem value="superuser">Superuser</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="superuser">Superuser</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {(isUniversalUser || currentUser?.role === 'universal_user') && (
                    <p className="text-xs text-gray-500 mt-1">
                      Universal users can only create Superuser accounts
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <Input
                    type="text"
                    value={newUser.company}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Company is automatically set to your company</p>
                </div>
                <CommonButton type="submit">
                  Create User
                </CommonButton>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(isUniversalUser || currentUser?.role === 'universal_user') ? (
                      <SelectItem value="superuser">Superuser</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="superuser">Superuser</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <CommonButton 
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full"
                >
                  Cancel
                </CommonButton>
                <CommonButton 
                  onClick={handleSaveEdit}
                  className="w-full"
                >
                  Save Changes
                </CommonButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Input
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <Input
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex gap-2">
                <CommonButton 
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </CommonButton>
                <CommonButton 
                  onClick={handleSavePassword}
                  className="flex-1"
                >
                  Reset Password
                </CommonButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className="border-[#34495E] text-[#34495E]"
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {typeof user.company === 'string' 
                    ? user.company 
                    : (user.company && typeof user.company === 'object' && 'name' in user.company)
                      ? user.company.name 
                      : 'N/A'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <CommonButton
                      variant="info"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </CommonButton>
                    <CommonButton
                      variant="warning"
                      size="sm"
                      onClick={() => handleResetPassword(user)}
                    >
                      Reset Password
                    </CommonButton>
                    <CommonButton
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id.toString())}
                    >
                      Delete
                    </CommonButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 