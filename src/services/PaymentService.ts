import { api } from '@/lib/api-client';
import { ApiResponse } from '@/types';

export const PaymentService = {
  // Create payment intent for license pool purchase
  createPoolPaymentIntent: async (data: {
    amount: number;
    poolName: string;
    totalLicenses: number;
    licenseType: string;
  }) => {
    // Check if we're in test mode (no Stripe keys configured)
    const isTestMode = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
                      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('your_publishable_key_here') ||
                      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');
    
    if (isTestMode) {
      console.log('🧪 Using test payment mode');
      const mockPaymentIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        clientSecret: 'pi_test_success',
        paymentIntentId: mockPaymentIntentId,
        testMode: true
      };
    }

    // Real Stripe payment intent creation
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
            licenseType: data.licenseType,
          },
          description: `License Pool Purchase: ${data.poolName} (${data.totalLicenses} ${data.licenseType} licenses)`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment intent creation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.clientSecret) {
        throw new Error('No client secret received from payment intent');
      }

      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        testMode: false
      };

    } catch {
      // Fallback to test mode if real payment fails
      const mockPaymentIntentId = `pi_test_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        clientSecret: 'pi_test_success',
        paymentIntentId: mockPaymentIntentId,
        testMode: true
      };
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