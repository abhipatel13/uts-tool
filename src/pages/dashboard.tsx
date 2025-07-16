'use client';

import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import LicenseProtectedRoute from '../components/LicenseProtectedRoute';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: {}
  };
};

const Dashboard: React.FC = () => {
  const { user, logout, isLoggingOut } = useAuth();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    await logout();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`${
            isLoggingOut ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-600'
          } text-white px-4 py-2 rounded transition-colors`}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
      
      {/* Superuser Section */}
      <LicenseProtectedRoute requiredRole="superuser">
        <div className="bg-purple-100 p-4 rounded-lg mb-4">
          <h2 className="text-xl font-semibold mb-2">System Controls</h2>
          <p>You have access to all system features and controls.</p>
          <div className="space-y-2 mt-4">
            <button className="bg-purple-500 text-white px-4 py-2 rounded">
              Manage Users
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded ml-2">
              Manage Licenses
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded ml-2">
              Asset Hierarchy
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded ml-2">
              System Preferences
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded ml-2">
              Templates
            </button>
          </div>
        </div>
      </LicenseProtectedRoute>

      {/* Admin Section */}
      <LicenseProtectedRoute requiredRole="admin">
        <div className="bg-purple-100 p-4 rounded-lg mb-4">
          <h2 className="text-xl font-semibold mb-2">System Controls</h2>
          <p>You have access to all system features and controls.</p>
          <div className="space-y-2 mt-4">
            <button className="bg-purple-500 text-white px-4 py-2 rounded">
              Manage Users
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded ml-2">
              Manage Licenses
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded ml-2">
              Asset Hierarchy
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded ml-2">
              System Preferences
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded ml-2">
              Templates
            </button>
          </div>
        </div>
      </LicenseProtectedRoute>

      {/* Supervisor Section */}
      <LicenseProtectedRoute requiredPermission="risk_assessment">
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
      </LicenseProtectedRoute>

      {/* Regular User Section */}
      <LicenseProtectedRoute requiredPermission="risk_assessment_creation">
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
      </LicenseProtectedRoute>

      {/* User Info */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">User Information</h2>
        <p>Name: {user?.name}</p>
        <p>Role: {user?.role}</p>
        <p>Email: {user?.email}</p>
      </div>
    </div>
  );
};

export default Dashboard; 