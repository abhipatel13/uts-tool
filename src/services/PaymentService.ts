import { api } from '@/lib/api-client';
import { ApiResponse } from '@/types';

export const PaymentService = {
  // Create payment intent for license pool purchase
  createPoolPaymentIntent: async (data: {
    amount: number;
    poolName: string;
    totalLicenses: number;
    validityMonths: number;
  }) => {
    // Always use real Stripe API calls
    try {
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount,
          metadata: {
            type: 'license_pool_purchase',
            poolName: data.poolName,
            totalLicenses: data.totalLicenses.toString(),
            validityMonths: data.validityMonths.toString(),
          },
          description: `License Pool Purchase: ${data.poolName} (${data.totalLicenses} licenses, ${data.validityMonths} months)`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Payment intent creation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.clientSecret) {
        throw new Error('No client secret received from payment intent');
      }

      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        testMode: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') || false
      };

    } catch (error) {
      console.error('Payment intent creation error:', error);
      throw error;
    }
  },

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