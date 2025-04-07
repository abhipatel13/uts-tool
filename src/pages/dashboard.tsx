import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useRouter } from 'next/router';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
      
      {/* Superuser Section */}
      <ProtectedRoute requiredRole="superuser">
        <div className="bg-red-100 p-4 rounded-lg mb-4">
          <h2 className="text-xl font-semibold mb-2">Superuser Controls</h2>
          <p>You have access to all system features and controls.</p>
        </div>
      </ProtectedRoute>

      {/* Admin Section */}
      <ProtectedRoute requiredRole="admin">
        <div className="bg-blue-100 p-4 rounded-lg mb-4">
          <h2 className="text-xl font-semibold mb-2">Admin Controls</h2>
          <div className="space-y-2">
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Manage Users
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded ml-2">
              Manage Licenses
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded ml-2">
              Asset Hierarchy
            </button>
          </div>
        </div>
      </ProtectedRoute>

      {/* Supervisor Section */}
      <ProtectedRoute requiredPermission="risk_assessment">
        <div className="bg-green-100 p-4 rounded-lg mb-4">
          <h2 className="text-xl font-semibold mb-2">Risk Assessment</h2>
          <div className="space-y-2">
            <button className="bg-green-500 text-white px-4 py-2 rounded">
              View Risk Assessments
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded ml-2">
              Generate Reports
            </button>
          </div>
        </div>
      </ProtectedRoute>

      {/* Regular User Section */}
      <ProtectedRoute requiredPermission="risk_assessment_creation">
        <div className="bg-yellow-100 p-4 rounded-lg mb-4">
          <h2 className="text-xl font-semibold mb-2">Risk Assessment Creation</h2>
          <div className="space-y-2">
            <button className="bg-yellow-500 text-white px-4 py-2 rounded">
              Create New Assessment
            </button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded ml-2">
              My Assessments
            </button>
          </div>
        </div>
      </ProtectedRoute>

      {/* User Info */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">User Information</h2>
        <p>Username: {user?.username}</p>
        <p>Role: {user?.role}</p>
        <p>Email: {user?.email}</p>
      </div>
    </div>
  );
};

export default Dashboard; 