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
    return api.post<ApiResponse<unknown>>('/api/payments/process', data, { includeSiteHeader: false });
  },

  // Get all payments (SuperAdmin only)
  getAllPayments: async () => {
    return api.get<ApiResponse<unknown[]>>('/api/payments/all', { includeSiteHeader: false });
  },

  // Get user's payment history
  getUserPayments: async (userId: number) => {
    return api.get<ApiResponse<unknown[]>>(`/api/payments/user/${userId}`, { includeSiteHeader: false });
  },

  // Check payment status
  checkPaymentStatus: async (userId: number) => {
    return api.get<ApiResponse<unknown>>(`/api/payments/status/${userId}`, { includeSiteHeader: false });
  },

  // Get all users' subscription status (SuperAdmin only)
  getAllUsersSubscriptionStatus: async () => {
    return api.get<ApiResponse<unknown[]>>('/api/payments/users/subscription-status', { includeSiteHeader: false });
  }
}; 