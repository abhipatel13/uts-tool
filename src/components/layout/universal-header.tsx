"use client"

import { Crown, LogOut } from "lucide-react"
import { CommonButton } from "@/components/ui/common-button"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface User {
  id: string | number;
  email: string;
  name?: string;
  role: string;
}

export function UniversalHeader() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return (
    <div className="bg-[#34495E] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-red-400" />
            <div>
              <h1 className="text-2xl font-bold">Universal Portal</h1>
              <p className="text-sm text-gray-300">System Administration & User Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, {currentUser?.name || currentUser?.email}</span>
            <CommonButton 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="text-white border-white hover:bg-white hover:text-[#34495E]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </CommonButton>
          </div>
        </div>
      </div>
    </div>
  );
} 