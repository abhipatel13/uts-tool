"use client";

import { useState, useEffect } from 'react';
import { PaymentService } from '@/services/PaymentService';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCurrentUser } from "@/utils/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "@/config/stripe";
import PaymentForm from "@/components/stripe/PaymentForm";

interface Payment {
  id: number;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  validUntil: string;
  user?: {
    name: string;
    email: string;
  };
  processor: {
    name: string;
    email: string;
  };
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  validUntil: string | null;
  lastPaymentAmount: number | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionStatus: SubscriptionStatus;
}

interface ApiError {
  message: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '1',
    name: 'Monthly',
    price: 99.99,
    duration: 1,
    features: [
      'Full access to all features',
      'Priority support',
      'Monthly updates',
      'Cancel anytime'
    ]
  },
  {
    id: '6',
    name: '6 Months',
    price: 549.99,
    duration: 6,
    features: [
      'All Monthly features',
      'Save 8% compared to monthly',
      'Quarterly review sessions',
      'Premium support'
    ]
  },
  {
    id: '12',
    name: 'Annual',
    price: 999.99,
    duration: 12,
    features: [
      'All 6-month features',
      'Save 17% compared to monthly',
      'Dedicated account manager',
      'Custom solutions'
    ]
  }
];

export default function PaymentAndSubscriptionPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '99.99',
    paymentMethod: 'card',
    validityMonths: '1'
  });
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setCurrentUser(user);
    loadData(user);
  }, []);

  const loadData = async (user: User) => {
    try {
      if (user.role === 'admin' || user.role === 'superuser') {
        // Load both payments and subscription data for admins
        const [paymentsResponse, subscriptionsResponse] = await Promise.all([
          PaymentService.getAllPayments(),
          PaymentService.getAllUsersSubscriptionStatus()
        ]);
        setPayments(paymentsResponse.data);
        setUsers(subscriptionsResponse.data);
      } else {
        // Load only user's data for regular users
        const [paymentsResponse, subscriptionResponse] = await Promise.all([
          PaymentService.getUserPayments(parseInt(user.id)),
          PaymentService.checkPaymentStatus(parseInt(user.id))
        ]);
        setPayments(paymentsResponse.data);
        setUsers([{ ...user, subscriptionStatus: subscriptionResponse.data }]);
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description: apiError.message || "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeClick = (user: User) => {
    setSelectedUser(user);
    setShowSubscribeDialog(true);
  };

  const getDaysUntilExpiry = (validUntil: string | null): number => {
    if (!validUntil) return 0;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePaymentSuccess = async () => {
    try {
      const targetUser = selectedUser || currentUser;
      if (!targetUser) return;

      await PaymentService.processPayment({
        userId: parseInt(targetUser.id),
        amount: parseFloat(paymentForm.amount),
        paymentMethod: 'stripe',
        validityMonths: parseInt(paymentForm.validityMonths)
      });
      
      toast({
        title: "Success",
        description: "Payment processed successfully"
      });
      
      setShowSubscribeDialog(false);
      const user = getCurrentUser();
      loadData(user);
      
      setPaymentForm({
        amount: '99.99',
        paymentMethod: 'card',
        validityMonths: '1'
      });
      setSelectedUser(null);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description: apiError.message || "Failed to process payment",
        variant: "destructive"
      });
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(44,62,80)] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superuser';

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment & Subscription Management</h1>
        <div className="text-sm text-gray-500">
          Total Users: {users.length} | Active Subscriptions: {users.filter(u => u.subscriptionStatus.hasActiveSubscription).length}
        </div>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const daysLeft = getDaysUntilExpiry(user.subscriptionStatus.validUntil);
                    const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              !user.subscriptionStatus.hasActiveSubscription 
                                ? "destructive" 
                                : isExpiringSoon 
                                ? "outline" 
                                : "default"
                            }
                          >
                            {!user.subscriptionStatus.hasActiveSubscription 
                              ? "Inactive" 
                              : isExpiringSoon 
                              ? "Expiring Soon" 
                              : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.subscriptionStatus.validUntil 
                            ? new Date(user.subscriptionStatus.validUntil).toLocaleDateString()
                            : 'Not subscribed'}
                        </TableCell>
                        <TableCell>
                          {daysLeft > 0 
                            ? `${daysLeft} days`
                            : 'Expired'}
                        </TableCell>
                        <TableCell>
                          {user.subscriptionStatus.lastPaymentAmount 
                            ? `$${user.subscriptionStatus.lastPaymentAmount}`
                            : 'No payment'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={user.subscriptionStatus.hasActiveSubscription ? "outline" : "default"}
                            onClick={() => handleSubscribeClick(user)}
                            className="w-[140px]"
                          >
                            {user.subscriptionStatus.hasActiveSubscription ? 'Renew' : 'Subscribe'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {isAdmin && <TableHead>User</TableHead>}
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
                      {isAdmin && payment.user && (
                        <TableCell>
              <div>
                            <div className="font-medium">{payment.user.name}</div>
                            <div className="text-sm text-gray-500">{payment.user.email}</div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'destructive'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(payment.validUntil).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.processor.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscribe Dialog */}
      <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.subscriptionStatus.hasActiveSubscription 
                ? `Renew Subscription for ${selectedUser.name}`
                : `New Subscription for ${selectedUser?.name}`}
            </DialogTitle>
          </DialogHeader>

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan?.id === plan.id 
                    ? 'border-2 border-primary shadow-lg' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => {
                  setSelectedPlan(plan);
                  setPaymentForm({
                    ...paymentForm,
                    amount: plan.price.toString(),
                    validityMonths: plan.id
                  });
                }}
              >
                <CardContent className="p-6">
                  <div className="text-xl font-bold mb-2">{plan.name}</div>
                  <div className="text-3xl font-bold mb-4">
                    ${plan.price}
                    <span className="text-sm font-normal text-gray-500">
                      /{plan.duration === 1 ? 'month' : `${plan.duration} months`}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <svg
                          className="w-4 h-4 mr-2 text-green-500"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
              </div>
              
          <div className="space-y-4">
            {selectedPlan && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Selected Plan</div>
                <div className="font-medium">{selectedPlan.name}</div>
                <div className="text-2xl font-bold">${selectedPlan.price}</div>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Subscription Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Plan Price</span>
                  <span>${selectedPlan?.price || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span>{selectedPlan?.duration || 0} months</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${selectedPlan?.price || 0}</span>
                </div>
              </div>
            </div>

            {selectedPlan && (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  amount={selectedPlan.price}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </Elements>
            )}

            {!selectedPlan && (
              <div className="text-sm text-center text-gray-500">
                Please select a plan to continue
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 