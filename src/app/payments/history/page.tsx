"use client";

import { useState, useEffect } from 'react';
import { PaymentService } from '@/services/PaymentService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

interface Payment {
  id: number;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  validUntil: string;
  processor: {
    name: string;
    email: string;
  };
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean;
    validUntil: string | null;
  } | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      // Assuming we can get the current user's ID from context/auth
      const userId = 1; // Replace with actual user ID from auth context
      
      const [paymentsResponse, statusResponse] = await Promise.all([
        PaymentService.getUserPayments(userId),
        PaymentService.checkPaymentStatus(userId)
      ]);

      setPayments(paymentsResponse.data);
      setSubscriptionStatus(statusResponse.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Payment History</h1>

      {/* Subscription Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg">
            {subscriptionStatus?.hasActiveSubscription ? (
              <div className="text-green-600">
                Active until: {new Date(subscriptionStatus.validUntil!).toLocaleDateString()}
              </div>
            ) : (
              <div className="text-red-600">No active subscription</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Processed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>${payment.amount}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell>{payment.status}</TableCell>
                  <TableCell>{new Date(payment.validUntil).toLocaleDateString()}</TableCell>
                  <TableCell>{payment.processor.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 