import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const PaymentService = {
  // Process payment (SuperAdmin only)
  processPayment: async (data: {
    userId: number;
    amount: number;
    paymentMethod: string;
    validityMonths?: number;
  }) => {
    const response = await axios.post(`${API_URL}/payments/process`, data);
    return response.data;
  },

  // Get all payments (SuperAdmin only)
  getAllPayments: async () => {
    const response = await axios.get(`${API_URL}/payments/all`);
    return response.data;
  },

  // Get user's payment history
  getUserPayments: async (userId: number) => {
    const response = await axios.get(`${API_URL}/payments/user/${userId}`);
    return response.data;
  },

  // Check payment status
  checkPaymentStatus: async (userId: number) => {
    const response = await axios.get(`${API_URL}/payments/status/${userId}`);
    return response.data;
  }
}; 