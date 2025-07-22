"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { userApi } from "@/services/userApi";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";

interface User {
  id: number;
  email: string;
  role: string;
  company: {
    id?: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  } | string;
}

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Starting to fetch users...');
        const response = await userApi.getAll();
        console.log('Users fetched:', response);
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
          
          // Only superusers can access user management
          if (user.role !== 'superuser') {
            setError('Access denied. Only superusers can manage users.');
            return;
          }
          
          // Set the company in newUser state when current user is loaded
          setNewUser({ 
            email: '', 
            password: '', 
            role: 'user',
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

      const response = await userApi.create(userToCreate);
      if (response.status) {
        toast({
          title: "Success",
          description: "User created successfully",
        });
        setIsCreateDialogOpen(false);
        setNewUser({ 
          email: '', 
          password: '', 
          role: 'user',
          company: typeof currentUser?.company === 'string' 
          ? currentUser.company 
          : (currentUser?.company && typeof currentUser.company === 'object' && 'name' in currentUser.company)
            ? currentUser.company.name 
            : '' 
        });
        // Refresh the users list
        const updatedResponse = await userApi.getAll();
        if (updatedResponse.status) {
          setUsers(updatedResponse.data);
        }
      }
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      
      // Handle validation errors from backend
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { errors?: Array<{ field: string; message: string }>, message?: string } } };
        
        if (axiosError.response?.data?.errors) {
          const validationErrors = axiosError.response.data.errors;
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
        } else if (axiosError.response?.data?.message) {
          toast({
            title: "Error",
            description: axiosError.response.data.message,
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
      const response = await userApi.delete(userId);
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
      const response = await userApi.update(selectedUser.id.toString(), {
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
        const axiosError = error as { response?: { data?: { errors?: Array<{ field: string; message: string }>, message?: string } } };
        
        if (axiosError.response?.data?.errors) {
          const validationErrors = axiosError.response.data.errors;
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
        } else if (axiosError.response?.data?.message) {
          toast({
            title: "Error",
            description: axiosError.response.data.message,
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
      const response = await userApi.resetPassword(selectedUser.id.toString(), passwordFormData.newPassword);
      
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="default"
                className="bg-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)]"
              >
                Create New User
              </Button>
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
                      <SelectItem value="superuser">Superuser</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full border-[rgb(52_73_94_/_1)] text-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)] hover:text-white"
                >
                  Create User
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                    <SelectItem value="superuser">Superuser</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)]"
                >
                  Save Changes
                </Button>
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
                <Button 
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePassword}
                  className="flex-1 bg-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)]"
                >
                  Reset Password
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                  className="border-[rgb(52_73_94_/_1)] text-[rgb(52_73_94_/_1)]"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetPassword(user)}
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id.toString())}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 