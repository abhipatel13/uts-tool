import axios from 'axios';
import { getAuthToken } from '@/utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create headers with auth token
const getHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Handle authentication errors
const handleAuthError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
    throw new Error('Authentication expired. Please login again.');
  }
  throw error;
};

export const PaymentService = {
  // Process payment (SuperAdmin only)
  processPayment: async (data: {
    userId: number;
    amount: number;
    paymentMethod: string;
    validityMonths?: number;
  }) => {
    try {
      const response = await axios.post(`${API_URL}/api/payments/process`, data, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  // Get all payments (SuperAdmin only)
  getAllPayments: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/all`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  // Get user's payment history
  getUserPayments: async (userId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/user/${userId}`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  // Check payment status
  checkPaymentStatus: async (userId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/status/${userId}`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  // Get all users' subscription status (SuperAdmin only)
  getAllUsersSubscriptionStatus: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/users/subscription-status`, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  }
}; 