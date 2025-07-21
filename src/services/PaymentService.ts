import { api } from '@/lib/api-client';
import { ApiResponse } from '@/types';

export const PaymentService = {
  // Process payment (SuperAdmin only)
  processPayment: async (data: {
    userId: number;
    amount: number;
    paymentMethod: string;
    validityMonths?: number;
  }) => {
    return api.post<ApiResponse<unknown>>('/api/payments/process', data);
  },

  // Get all payments (SuperAdmin only)
  getAllPayments: async () => {
    return api.get<ApiResponse<unknown[]>>('/api/payments/all');
  },

  // Get user's payment history
  getUserPayments: async (userId: number) => {
    return api.get<ApiResponse<unknown[]>>(`/api/payments/user/${userId}`);
  },

  // Check payment status
  checkPaymentStatus: async (userId: number) => {
    return api.get<ApiResponse<unknown>>(`/api/payments/status/${userId}`);
  },

  // Get all users' subscription status (SuperAdmin only)
  getAllUsersSubscriptionStatus: async () => {
    return api.get<ApiResponse<unknown[]>>('/api/payments/users/subscription-status');
  }
}; 