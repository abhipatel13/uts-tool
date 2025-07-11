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
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create user',
        variant: "destructive",
      });
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
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete user",
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
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
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
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id.toString())}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 