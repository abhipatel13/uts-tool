"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommonButton } from "@/components/ui/common-button"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/utils/auth";
import { 
  LicensePoolService, 
  LicenseAllocationService, 
  LicenseAdminService
} from "@/services";

import PoolPaymentForm from "@/components/stripe/PoolPaymentForm";
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '@/config/stripe';
import type { LicensePool, LicenseAllocation, LicenseAnalytics } from "@/types";
import { UserApi } from "@/services";
import type { User as ApiUser } from "@/types";
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Package, 
  Trash2,
  UserPlus
} from "lucide-react";

const LicensingAdminPage = () => {
  const [licensePools, setLicensePools] = useState<LicensePool[]>([]);
  const [allocations, setAllocations] = useState<LicenseAllocation[]>([]);
  const [analytics, setAnalytics] = useState<LicenseAnalytics | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePoolDialog, setShowCreatePoolDialog] = useState(false);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletePoolId, setDeletePoolId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pools' | 'allocations' | 'analytics'>('pools');
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Form states
  const [createPoolForm, setCreatePoolForm] = useState({
    poolName: '',
    totalLicenses: 5,
    validityPeriodMonths: 1,
    totalAmount: 99.95, // Will be auto-calculated
    pricePerLicense: 19.99,
    notes: '',
    fullPayment: true,
    autoRenew: false
  });

  // Calculate discount based on validity months
  const calculateDiscount = (months: number): number => {
    if (months >= 12) return 0.10; // 10% off
    if (months >= 6) return 0.05;  // 5% off
    return 0; // No discount for 0-5 months
  };

  // Auto-calculate total amount when totalLicenses, pricePerLicense, or validityPeriodMonths changes
  useEffect(() => {
    const baseAmount = createPoolForm.totalLicenses * createPoolForm.pricePerLicense * createPoolForm.validityPeriodMonths;
    const discount = calculateDiscount(createPoolForm.validityPeriodMonths);
    const discountAmount = baseAmount * discount;
    const calculatedTotal = baseAmount - discountAmount;
    
    setCreatePoolForm(prev => ({
      ...prev,
      totalAmount: calculatedTotal
    }));
  }, [createPoolForm.totalLicenses, createPoolForm.pricePerLicense, createPoolForm.validityPeriodMonths]);

  const [allocationForm, setAllocationForm] = useState({
    licensePoolId: '',
    userId: '',
    validFrom: new Date().toISOString().split('T')[0],
    notes: '',
    autoRenew: false
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    if (user.role !== 'superuser') {
      window.location.href = '/unauthorized';
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [
        poolsResponse,
        allocationsResponse,
        analyticsResponse,
        usersResponse
      ] = await Promise.all([
        LicensePoolService.getAllLicensePools(),
        LicenseAllocationService.getAllAllocations(),
        LicenseAdminService.getLicenseAnalytics(),
        UserApi.getAll()
      ]);

      // Handle both ApiResponse format and direct data format
      setLicensePools(poolsResponse?.data || poolsResponse || []);
      setAllocations(allocationsResponse?.data || allocationsResponse || []);
      setAnalytics(analyticsResponse?.data || analyticsResponse || null);
      setUsers(usersResponse?.data || usersResponse || []);

    } catch (error: unknown) {
      console.error('Error loading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load license management data';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async (paymentIntentId?: string) => {
    try {
      // Map validity months to license type for backward compatibility
      const getLicenseType = (months: number): 'monthly' | 'quarterly' | 'semi_annual' | 'annual' => {
        if (months >= 12) return 'annual';
        if (months >= 6) return 'semi_annual';
        if (months >= 3) return 'quarterly';
        return 'monthly';
      };

      const poolData = {
        poolName: createPoolForm.poolName,
        totalLicenses: createPoolForm.totalLicenses,
        validityPeriodMonths: createPoolForm.validityPeriodMonths,
        licenseType: getLicenseType(createPoolForm.validityPeriodMonths), // For backward compatibility
        totalAmount: createPoolForm.totalAmount,
        pricePerLicense: createPoolForm.pricePerLicense,
        notes: createPoolForm.notes,
        fullPayment: createPoolForm.fullPayment,
        autoRenew: createPoolForm.autoRenew,
        stripePaymentIntentId: paymentIntentId
      };

      await LicensePoolService.createLicensePool(poolData);

      toast({
        title: "Success",
        description: "License pool created successfully"
      });

      setShowCreatePoolDialog(false);
      setShowPaymentStep(false);
      setCreatePoolForm({
        poolName: '',
        totalLicenses: 5,
        validityPeriodMonths: 1,
        totalAmount: 5 * 19.99, // Auto-calculated: totalLicenses * pricePerLicense * months with discount
        pricePerLicense: 19.99,
        notes: '',
        fullPayment: true,
        autoRenew: false
      });
      
      loadData();

    } catch (error: unknown) {
      console.error('Error creating license pool:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create license pool';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    handleCreatePool(paymentIntentId);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Error",
      description: error,
      variant: "destructive"
    });
    setIsPaymentProcessing(false);
  };

  const handleProceedToPayment = () => {
    // Validate form before proceeding to payment
    if (!createPoolForm.poolName || !createPoolForm.totalLicenses || !createPoolForm.totalAmount || !createPoolForm.validityPeriodMonths) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    if (createPoolForm.validityPeriodMonths > 12) {
      toast({
        title: "Validation Error",
        description: "Validity period cannot exceed 12 months",
        variant: "destructive"
      });
      return;
    }
    setShowPaymentStep(true);
  };

  const handleAllocateLicense = async () => {
    try {
      if (!allocationForm.licensePoolId || !allocationForm.userId) {
        toast({
          title: "Error",
          description: "Please select both a license pool and user",
          variant: "destructive"
        });
        return;
      }

      await LicenseAllocationService.allocateLicense({
        licensePoolId: parseInt(allocationForm.licensePoolId),
        userId: parseInt(allocationForm.userId),
        validFrom: allocationForm.validFrom,
        notes: allocationForm.notes || undefined,
        autoRenew: allocationForm.autoRenew
      });

      toast({
        title: "Success",
        description: "License allocated successfully"
      });

      setShowAllocationDialog(false);
      setAllocationForm({
        licensePoolId: '',
        userId: '',
        validFrom: new Date().toISOString().split('T')[0],
        notes: '',
        autoRenew: false
      });
      
      loadData();

    } catch (error: unknown) {
      console.error('Error allocating license:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to allocate license';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleRevokeLicense = async (allocationId: number, reason?: string) => {
    try {
      await LicenseAllocationService.revokeLicense(allocationId, reason);
      
      toast({
        title: "Success",
        description: "License revoked successfully"
      });
      
      loadData();

    } catch (error: unknown) {
      console.error('Error revoking license:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke license';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDeletePool = async () => {
    if (!deletePoolId) return;
    
    try {
      await LicensePoolService.deleteLicensePool(deletePoolId);
      await loadData();
      toast({
        title: "Success",
        description: "License pool deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting license pool:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete license pool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletePoolId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Highlight matching text in search results
  const highlightMatch = (text: string | undefined | null, searchTerm: string) => {
    if (!text || !searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'allocated':
        return 'secondary';
      case 'expired':
        return 'destructive';
      case 'revoked':
        return 'outline';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiry = (validUntil: string): number => {
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(44,62,80)] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading license management data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
      </div>
      
      {/* Responsive header section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50]">License Management</h1>
          
          {/* Search and Add button row */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div className="flex-1 sm:max-w-md order-2 sm:order-1">
              <Input 
                className="w-full" 
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 order-1 sm:order-2">
              <Dialog open={showCreatePoolDialog} onOpenChange={(open) => {
                setShowCreatePoolDialog(open);
                if (!open) {
                  setShowPaymentStep(false);
                  setIsPaymentProcessing(false);
                }
              }}>
                <DialogTrigger asChild>
                  <CommonButton>
                    <Package className="w-4 h-4 mr-2" />
                    Create License Pool
                  </CommonButton>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {showPaymentStep ? 'Complete Payment' : 'Create License Pool'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!showPaymentStep ? (
                      <>
                        <div>
                          <Label htmlFor="poolName">Pool Name</Label>
                          <Input
                            id="poolName"
                            value={createPoolForm.poolName}
                            onChange={(e) => setCreatePoolForm({...createPoolForm, poolName: e.target.value})}
                            placeholder="Enter pool name"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="totalLicenses">Total Licenses</Label>
                            <Input
                              id="totalLicenses"
                              type="number"
                              min="1"
                              value={createPoolForm.totalLicenses}
                              onChange={(e) => setCreatePoolForm({...createPoolForm, totalLicenses: parseInt(e.target.value) || 1})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="validityPeriodMonths">Validity (Months)</Label>
                            <Input
                              id="validityPeriodMonths"
                              type="number"
                              min="1"
                              max="12"
                              value={createPoolForm.validityPeriodMonths}
                              onChange={(e) => {
                                const months = parseInt(e.target.value) || 1;
                                if (months > 12) {
                                  toast({
                                    title: "Validation Error",
                                    description: "Validity period cannot exceed 12 months",
                                    variant: "destructive"
                                  });
                                  return;
                                }
                                setCreatePoolForm({...createPoolForm, validityPeriodMonths: months});
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pricePerLicense">Price per License ($)</Label>
                            <Input
                              id="pricePerLicense"
                              type="number"
                              step="0.01"
                              min="0"
                              value={createPoolForm.pricePerLicense}
                              onChange={(e) => setCreatePoolForm({...createPoolForm, pricePerLicense: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="totalAmount">Total Amount ($)</Label>
                            <Input
                              id="totalAmount"
                              type="number"
                              step="0.01"
                              min="0"
                              value={createPoolForm.totalAmount.toFixed(2)}
                              readOnly
                              className="bg-gray-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {createPoolForm.totalLicenses} × ${createPoolForm.pricePerLicense.toFixed(2)} × {createPoolForm.validityPeriodMonths} months
                              {calculateDiscount(createPoolForm.validityPeriodMonths) > 0 && (
                                <span className="text-green-600"> - {Math.round(calculateDiscount(createPoolForm.validityPeriodMonths) * 100)}% discount</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="autoRenew"
                            checked={createPoolForm.autoRenew}
                            onChange={(e) => setCreatePoolForm({...createPoolForm, autoRenew: e.target.checked})}
                            className="rounded"
                          />
                          <Label htmlFor="autoRenew">Automatic Renew</Label>
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes (optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Additional notes about this license pool"
                            value={createPoolForm.notes}
                            onChange={(e) => setCreatePoolForm({...createPoolForm, notes: e.target.value})}
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" onClick={() => setShowCreatePoolDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleProceedToPayment}>
                            Proceed to Payment
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Pool Details</h3>
                          <div className="text-sm space-y-1">
                            <div><strong>Name:</strong> {createPoolForm.poolName}</div>
                            <div><strong>Licenses:</strong> {createPoolForm.totalLicenses}</div>
                            <div><strong>Validity:</strong> {createPoolForm.validityPeriodMonths} months</div>
                            <div><strong>Price per License:</strong> ${createPoolForm.pricePerLicense.toFixed(2)}</div>
                            <div><strong>Total Amount:</strong> ${createPoolForm.totalAmount.toFixed(2)}</div>
                            {calculateDiscount(createPoolForm.validityPeriodMonths) > 0 && (
                              <div className="text-green-600">
                                <strong>Discount:</strong> {Math.round(calculateDiscount(createPoolForm.validityPeriodMonths) * 100)}% off
                              </div>
                            )}
                            <div><strong>Payment:</strong> {createPoolForm.fullPayment ? 'Full Payment' : 'Partial Payment'}</div>
                            <div><strong>Auto-renew:</strong> {createPoolForm.autoRenew ? 'Yes' : 'No'}</div>
                          </div>
                        </div>

                        <Elements stripe={stripePromise}>
                          <PoolPaymentForm
                            amount={createPoolForm.totalAmount}
                            poolName={createPoolForm.poolName}
                            totalLicenses={createPoolForm.totalLicenses}
                            validityMonths={createPoolForm.validityPeriodMonths}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                            isProcessing={isPaymentProcessing}
                            setIsProcessing={setIsPaymentProcessing}
                          />
                        </Elements>

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowPaymentStep(false)}
                            disabled={isPaymentProcessing}
                          >
                            Back
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAllocationDialog} onOpenChange={setShowAllocationDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Allocate License
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Allocate License to User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="licensePool">License Pool</Label>
                      <Select
                        value={allocationForm.licensePoolId}
                        onValueChange={(value) => setAllocationForm({...allocationForm, licensePoolId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select license pool" />
                        </SelectTrigger>
                        <SelectContent>
                          {licensePools.filter(pool => pool.status === 'active' && pool.availableLicenses > 0).map(pool => (
                            <SelectItem key={pool.id} value={String(pool.id)}>
                              {pool.poolName} ({pool.availableLicenses} available)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="user">User</Label>
                      <Select
                        value={allocationForm.userId}
                        onValueChange={(value: string) => setAllocationForm({...allocationForm, userId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => {
                            // Check if user has any active license allocation
                            const hasActiveLicense = allocations.some(allocation => 
                              allocation.userId === user.id && 
                              (allocation.status === 'allocated' || allocation.status === 'active')
                            );
                            
                            return (
                              <SelectItem 
                                key={user.id} 
                                value={String(user.id)}
                                disabled={hasActiveLicense}
                                className={hasActiveLicense ? "opacity-50 cursor-not-allowed" : ""}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{user.email}</span>
                                  {hasActiveLicense && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Licensed
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Users with existing active licenses are disabled. Revoke their current license first to allocate a new one.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="validFrom">Valid From</Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={allocationForm.validFrom}
                        onChange={(e) => setAllocationForm({...allocationForm, validFrom: e.target.value})}
                      />
                    </div>


                    <div>
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional notes about this allocation"
                        value={allocationForm.notes}
                        onChange={(e) => setAllocationForm({...allocationForm, notes: e.target.value})}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoRenew"
                        checked={allocationForm.autoRenew}
                        onChange={(e) => setAllocationForm({...allocationForm, autoRenew: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="autoRenew">Auto-renew license</Label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowAllocationDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAllocateLicense}>
                        Allocate License
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total License Pools</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.poolStatistics.reduce((sum: number, stat: { count: number }) => sum + stat.count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Active pools: {analytics.poolStatistics.find((s: { status: string }) => s.status === 'active')?.count || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.poolStatistics.reduce((sum: number, stat: { totalLicenses: number }) => sum + (stat.totalLicenses || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Allocated: {analytics.poolStatistics.reduce((sum: number, stat: { allocatedLicenses: number }) => sum + (stat.allocatedLicenses || 0), 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Allocations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.allocationStatistics.find((s: { status: string }) => s.status === 'active')?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total allocations: {analytics.allocationStatistics.reduce((sum: number, stat: { count: number }) => sum + stat.count, 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analytics.expiringLicenses.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Next 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="mx-4 max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete License Pool</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this license pool? This action cannot be undone.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
            <CommonButton variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </CommonButton>
            <CommonButton 
              variant="destructive" 
              onClick={handleDeletePool}
              className="w-full sm:w-auto"
            >
              Delete
            </CommonButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pools')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pools'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              License Pools
            </button>
            <button
              onClick={() => setActiveTab('allocations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'allocations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Allocations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* License Pools Table */}
      {activeTab === 'pools' && (
        <>
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto min-w-[800px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">ID</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm">Pool Name</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Type</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Total</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Allocated</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Price</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Status</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && licensePools.length > 0 &&
                    licensePools
                      .filter(pool => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          (pool.poolName && pool.poolName.toLowerCase().includes(searchLower)) ||
                          (pool.licenseType && pool.licenseType.toLowerCase().includes(searchLower)) ||
                          (pool.status && pool.status.toLowerCase().includes(searchLower)) ||
                          (pool.id && pool.id.toString().includes(searchTerm))
                        );
                      })
                      .map(pool => (
                        <tr 
                          key={pool.id} 
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 sm:p-4">
                            <div className="text-sm font-medium">{highlightMatch(pool.id.toString(), searchTerm)}</div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="text-sm break-words">{highlightMatch(pool.poolName, searchTerm)}</div>
                          </td>
                          <td className="p-3 sm:p-4 text-sm capitalize">{highlightMatch(pool.licenseType, searchTerm)}</td>
                          <td className="p-3 sm:p-4 text-sm">{pool.totalLicenses}</td>
                          <td className="p-3 sm:p-4 text-sm">{pool.allocatedLicenses || 0}</td>
                          <td className="p-3 sm:p-4 text-sm">{formatCurrency(pool.pricePerLicense)}</td>
                          <td className="p-3 sm:p-4">
                            <span className={`px-2 py-1 rounded-full text-xs 
                              ${pool.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : pool.status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : pool.status === 'suspended'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {pool.status}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="flex gap-1 sm:gap-2">
                              <CommonButton
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-9 sm:w-9"
                                onClick={() => {
                                  setDeletePoolId(pool.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </CommonButton>
                            </div>
                          </td>
                        </tr>
                      ))
                  }
                  {(!loading && licensePools.length === 0) && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-lg">No license pools found</div>
                          <div className="text-sm">Create a new license pool to get started.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A3FF]"></div>
                          <span>Loading license pools...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden">
            {!loading && licensePools.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-lg">No license pools found</div>
                  <div className="text-sm">Create a new license pool to get started.</div>
                </div>
              </div>
            )}
            
            {!loading && licensePools.length > 0 && (
              <div className="space-y-4">
                {licensePools
                  .filter(pool => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      (pool.poolName && pool.poolName.toLowerCase().includes(searchLower)) ||
                      (pool.licenseType && pool.licenseType.toLowerCase().includes(searchLower)) ||
                      (pool.status && pool.status.toLowerCase().includes(searchLower)) ||
                      (pool.id && pool.id.toString().includes(searchTerm))
                    );
                  })
                  .map(pool => (
                    <div 
                      key={pool.id} 
                      className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Header with ID and Actions */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-[#2C3E50] mb-1">
                            Pool ID: {highlightMatch(pool.id.toString(), searchTerm)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              pool.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : pool.status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : pool.status === 'suspended'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {pool.status}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">{pool.licenseType}</span>
                          </div>
                        </div>
                        <CommonButton
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                          onClick={() => {
                            setDeletePoolId(pool.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </CommonButton>
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-600 font-medium">Pool Name</div>
                          <div className="text-sm text-gray-900">{highlightMatch(pool.poolName, searchTerm)}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-gray-600 font-medium">Total</div>
                            <div className="text-sm text-gray-900">{pool.totalLicenses}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 font-medium">Allocated</div>
                            <div className="text-sm text-gray-900">{pool.allocatedLicenses || 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 font-medium">Price</div>
                            <div className="text-sm text-gray-900">{formatCurrency(pool.pricePerLicense)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </>
      )}

      {/* Allocations Table */}
      {activeTab === 'allocations' && (
        <>
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto min-w-[800px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">ID</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm">User</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Pool</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Status</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Valid From</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Valid Until</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Days Remaining</th>
                    <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && allocations.length > 0 &&
                    allocations
                      .filter(allocation => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          (allocation.user?.name && allocation.user.name.toLowerCase().includes(searchLower)) ||
                          (allocation.user?.email && allocation.user.email.toLowerCase().includes(searchLower)) ||
                          (allocation.licensePool?.poolName && allocation.licensePool.poolName.toLowerCase().includes(searchLower)) ||
                          (allocation.status && allocation.status.toLowerCase().includes(searchLower)) ||
                          (allocation.id && allocation.id.toString().includes(searchTerm))
                        );
                      })
                      .map(allocation => {
                        const daysRemaining = getDaysUntilExpiry(allocation.validUntil);
                        return (
                          <tr 
                            key={allocation.id} 
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3 sm:p-4">
                              <div className="text-sm font-medium">{highlightMatch(allocation.id.toString(), searchTerm)}</div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="text-sm break-words">
                                <div className="font-medium">{highlightMatch(allocation.user?.name, searchTerm)}</div>
                                <div className="text-gray-500">{highlightMatch(allocation.user?.email, searchTerm)}</div>
                              </div>
                            </td>
                            <td className="p-3 sm:p-4 text-sm">{highlightMatch(allocation.licensePool?.poolName, searchTerm)}</td>
                            <td className="p-3 sm:p-4">
                              <span className={`px-2 py-1 rounded-full text-xs 
                                ${allocation.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : allocation.status === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : allocation.status === 'revoked'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {allocation.status}
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-sm">{formatDate(allocation.validFrom)}</td>
                            <td className="p-3 sm:p-4 text-sm">{formatDate(allocation.validUntil)}</td>
                            <td className="p-3 sm:p-4 text-sm">
                              <span className={daysRemaining <= 7 ? 'text-red-600 font-medium' : daysRemaining <= 30 ? 'text-orange-600' : ''}>
                                {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                              </span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="flex gap-1 sm:gap-2">
                                {allocation.status === 'active' && (
                                  <CommonButton
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-9 sm:w-9"
                                    onClick={() => handleRevokeLicense(allocation.id, 'Revoked by admin')}
                                    title="Revoke"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </CommonButton>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  }
                  {(!loading && allocations.length === 0) && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-lg">No license allocations found</div>
                          <div className="text-sm">Allocate licenses to users to get started.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A3FF]"></div>
                          <span>Loading allocations...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden">
            {!loading && allocations.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-lg">No license allocations found</div>
                  <div className="text-sm">Allocate licenses to users to get started.</div>
                </div>
              </div>
            )}
            
            {!loading && allocations.length > 0 && (
              <div className="space-y-4">
                {allocations
                  .filter(allocation => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      (allocation.user?.name && allocation.user.name.toLowerCase().includes(searchLower)) ||
                      (allocation.user?.email && allocation.user.email.toLowerCase().includes(searchLower)) ||
                      (allocation.licensePool?.poolName && allocation.licensePool.poolName.toLowerCase().includes(searchLower)) ||
                      (allocation.status && allocation.status.toLowerCase().includes(searchLower)) ||
                      (allocation.id && allocation.id.toString().includes(searchTerm))
                    );
                  })
                  .map(allocation => {
                    const daysRemaining = getDaysUntilExpiry(allocation.validUntil);
                    return (
                      <div 
                        key={allocation.id} 
                        className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                      >
                        {/* Header with ID and Status */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[#2C3E50] mb-1">
                              Allocation ID: {highlightMatch(allocation.id.toString(), searchTerm)}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                allocation.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : allocation.status === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : allocation.status === 'revoked'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {allocation.status}
                              </span>
                              <span className={`text-xs ${
                                daysRemaining <= 7 ? 'text-red-600 font-medium' : daysRemaining <= 30 ? 'text-orange-600' : 'text-gray-500'
                              }`}>
                                {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                              </span>
                            </div>
                          </div>
                          {allocation.status === 'active' && (
                            <CommonButton
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                              onClick={() => handleRevokeLicense(allocation.id, 'Revoked by admin')}
                              title="Revoke"
                            >
                              <Trash2 className="h-4 w-4" />
                            </CommonButton>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-gray-600 font-medium">User</div>
                            <div className="text-sm text-gray-900">
                              <div>{highlightMatch(allocation.user?.name, searchTerm)}</div>
                              <div className="text-gray-500">{highlightMatch(allocation.user?.email, searchTerm)}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <div className="text-xs text-gray-600 font-medium">Pool</div>
                              <div className="text-sm text-gray-900">{highlightMatch(allocation.licensePool?.poolName, searchTerm)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-gray-600 font-medium">Valid From</div>
                                <div className="text-sm text-gray-900">{formatDate(allocation.validFrom)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 font-medium">Valid Until</div>
                                <div className="text-sm text-gray-900">{formatDate(allocation.validUntil)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pool Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.poolStatistics.map((stat: { status: string; count: number }) => (
                  <div key={stat.status} className="flex justify-between items-center py-2">
                    <span className="capitalize">{stat.status}</span>
                    <Badge variant={getStatusBadgeVariant(stat.status)}>
                      {stat.count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Allocation Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.allocationStatistics.map((stat: { status: string; count: number }) => (
                  <div key={stat.status} className="flex justify-between items-center py-2">
                    <span className="capitalize">{stat.status}</span>
                    <Badge variant={getStatusBadgeVariant(stat.status)}>
                      {stat.count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {analytics?.expiringLicenses && analytics.expiringLicenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Licenses Expiring Soon</CardTitle>
                <p className="text-sm text-gray-600">Licenses expiring in the next 30 days</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Pool</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Days Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.expiringLicenses.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell>{allocation.user?.name}</TableCell>
                        <TableCell>{allocation.licensePool?.poolName}</TableCell>
                        <TableCell>{formatDate(allocation.validUntil)}</TableCell>
                        <TableCell>
                          <span className="text-orange-600 font-medium">
                            {getDaysUntilExpiry(allocation.validUntil)} days
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default LicensingAdminPage; 