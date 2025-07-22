'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { userApi } from "@/services/userApi";


interface User {
  id: number;
  email: string;
  role: string;
  company: string | { id?: number; name: string; createdAt?: string; updatedAt?: string; deletedAt?: string | null; };
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchUserProfile = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setFormData(prev => ({
            ...prev,
            email: parsedUser.email
          }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast, mounted]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await userApi.updateProfile({
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.status) {
        // Update local storage with new user data
        const updatedUser = { ...user, email: formData.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser as User);
        
        setIsEditing(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));

        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (!mounted || loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>No user data found</div>;
  }

  return (
    <div className="container mx-auto py-10">
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Profile Settings</CardTitle>
            <Badge 
              variant={
                user.role === 'admin' ? 'outline' : 
                user.role === 'superuser' ? 'outline' : 'outline'
              }
              className={
                user.role === 'admin' ? 'border-primary text-primary' : 
                user.role === 'superuser' ? 'border-primary text-primary' : 'border-primary text-primary'
              }
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <Input
                type="text"
                value={typeof user.company === 'string' 
                  ? user.company 
                  : (user.company && typeof user.company === 'object' && 'name' in user.company)
                    ? user.company.name 
                    : ''
                }
                disabled
                className="bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-100' : ''}
              />
            </div>

            {isEditing && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Current Password</label>
                  <Input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <Input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-4">
              {!isEditing ? (
                <Button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="hover:bg-primary hover:text-primary-foreground"
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(prev => ({
                        ...prev,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      }));
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 