'use client';

import { CommonButton } from "@/components/ui/common-button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { UserApi } from "@/services/userApi"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user";
import { getCurrentUser } from "@/utils/auth"

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchUserProfile = async () => {
      try {
        // Fetch fresh user data from API instead of localStorage
        const response = await UserApi.getProfile();
        if (response.status) {
          const freshUserData = response.data;
          setUser(freshUserData);
          setFormData({
            name: freshUserData.name || '',
            email: freshUserData.email,
            department: freshUserData.department || '',
            phone: freshUserData.phone || ''
          });
        } else {
          // Fallback to localStorage if API fails
          const userData = getCurrentUser()
          if (userData) {
            setUser(userData);
            setFormData({
              name: userData.name || '',
              email: userData.email,
              department: userData.department || '',
              phone: userData.phone || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to localStorage if API fails
        const userData = getCurrentUser()
        if (userData) {
          setUser(userData);
          setFormData({
            name: userData.name || '',
            email: userData.email,
            department: userData.department || '',
            phone: userData.phone || ''
          });
        }
        toast({
          title: "Warning",
          description: "Using cached profile data. Some information may be outdated.",
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

    try {
      const response = await UserApi.updateProfile({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        phone: formData.phone,
        currentPassword: '', // Not needed for profile update
        newPassword: '', // Not needed for profile update
      });

            if (response.status) {
        // Fetch fresh user data from API after successful update
        const freshResponse = await UserApi.getProfile();
        if (freshResponse.status) {
          const updatedUser = freshResponse.data;
          setUser(updatedUser);
          setFormData({
            name: updatedUser.name || '',
            email: updatedUser.email,
            department: updatedUser.department || '',
            phone: updatedUser.phone || '',
          });
        } else {
          // Fallback: update with form data
          const updatedUser = { 
            ...user, 
            name: formData.name,
            email: formData.email,
            department: formData.department,
            phone: formData.phone
          };
          setUser(updatedUser as User);
          setFormData({
            name: formData.name,
            email: formData.email,
            department: formData.department,
            phone: formData.phone,
          });
        }
        
        setIsEditing(false);
        
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await UserApi.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.status) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsPasswordEditing(false);
        
        toast({
          title: "Success",
          description: "Password updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
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
    <div className="container mx-auto py-10 space-y-8">
      
      {/* Profile Information Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Profile Information</CardTitle>
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
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-100' : ''}
                placeholder="Enter full name"
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

            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <Input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-100' : ''}
                placeholder="Enter department"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-100' : ''}
                placeholder="Enter phone number"
              />
            </div>



            <div className="flex justify-end gap-4">
              {!isEditing ? (
                <CommonButton 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </CommonButton>
              ) : (
                <>
                  <CommonButton 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        department: user?.department || '',
                        phone: user?.phone || '',
                      });
                    }}
                  >
                    Cancel
                  </CommonButton>
                  <CommonButton 
                    type="submit"
                  >
                    Save Changes
                  </CommonButton>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                disabled={!isPasswordEditing}
                className={!isPasswordEditing ? 'bg-gray-100' : ''}
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                disabled={!isPasswordEditing}
                className={!isPasswordEditing ? 'bg-gray-100' : ''}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                disabled={!isPasswordEditing}
                className={!isPasswordEditing ? 'bg-gray-100' : ''}
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex justify-end gap-4">
              {!isPasswordEditing ? (
                <CommonButton 
                  type="button" 
                  onClick={() => setIsPasswordEditing(true)}
                >
                  Change Password
                </CommonButton>
              ) : (
                <>
                  <CommonButton 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsPasswordEditing(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                  >
                    Cancel
                  </CommonButton>
                  <CommonButton 
                    type="submit"
                  >
                    Update Password
                  </CommonButton>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 