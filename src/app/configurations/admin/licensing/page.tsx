"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommonButton } from "@/components/ui/common-button"
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard } from "lucide-react";
import { getCurrentUser } from "@/utils/auth";
import {
  LicensePoolService,
  LicenseAllocationService,
  LicensePool,
  LicenseAllocation
} from "@/services/licenseService";
import { userApi } from "@/services/userApi";
import type { User as ApiUser } from "@/services/userApi";
import PaymentForm from "@/components/stripe/PaymentForm";

const LicensingAdminPage = () => {
  const [licensePools, setLicensePools] = useState<LicensePool[]>([]);
  const [allocations, setAllocations] = useState<LicenseAllocation[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [showCreatePoolDialog, setShowCreatePoolDialog] = useState(false);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [isAllocatingLicense, setIsAllocatingLicense] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isRevokingLicense, setIsRevokingLicense] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<LicenseAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [createPoolForm, setCreatePoolForm] = useState({
    poolName: '',
    licenseType: 'monthly',
    totalLicenses: 1,
    validityPeriodMonths: 1,
    pricePerLicense: 99, // Default price
    notes: ''
  });

  const [allocationForm, setAllocationForm] = useState({
    licensePoolId: '',
    userId: '',
    validFrom: new Date().toISOString().split('T')[0],
    customValidityMonths: '',
    notes: '',
    autoRenew: false
  });

  const [revokeForm, setRevokeForm] = useState({
    reason: ''
  });

  // Calculate total amount automatically
  const totalAmount = createPoolForm.totalLicenses * createPoolForm.pricePerLicense;

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
      setIsLoading(true);
      const [poolsRes, allocsRes, usersRes] = await Promise.all([
        LicensePoolService.getAllLicensePools(),
        LicenseAllocationService.getAllAllocations(),
        userApi.getAll()
      ]);
      setLicensePools(poolsRes.data || []);
      setAllocations(allocsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePoolRequest = () => {
    // Validation before showing payment
    if (!createPoolForm.poolName.trim()) {
      toast({ title: 'Error', description: 'Please enter pool name', variant: 'destructive' });
      return;
    }
    if (createPoolForm.totalLicenses < 1) {
      toast({ title: 'Error', description: 'Total licenses must be at least 1', variant: 'destructive' });
      return;
    }
    if (createPoolForm.pricePerLicense < 0) {
      toast({ title: 'Error', description: 'Price per license cannot be negative', variant: 'destructive' });
      return;
    }
    if (createPoolForm.validityPeriodMonths < 1) {
      toast({ title: 'Error', description: 'Validity period must be at least 1 month', variant: 'destructive' });
      return;
    }

    // Show payment dialog
    setShowCreatePoolDialog(false);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      setIsCreatingPool(true);
      
      const poolData = {
        ...createPoolForm,
        totalAmount: totalAmount
      };
      
      await LicensePoolService.createLicensePool(poolData);
      toast({ title: 'Success', description: 'License pool created successfully!' });
      
      // Reset forms and close dialogs
      setShowPaymentDialog(false);
      setCreatePoolForm({ 
        poolName: '', 
        licenseType: 'monthly', 
        totalLicenses: 1, 
        validityPeriodMonths: 1, 
        pricePerLicense: 99, 
        notes: '' 
      });
      
      loadData();
    } catch (error) {
      console.error('Error creating pool:', error);
      toast({ title: 'Error', description: 'Failed to create pool', variant: 'destructive' });
    } finally {
      setIsCreatingPool(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast({ title: 'Payment Failed', description: error, variant: 'destructive' });
    setShowPaymentDialog(false);
    setShowCreatePoolDialog(true); // Return to form
  };

  const handleAllocateLicense = async () => {
    try {
      // Validation
      if (!allocationForm.licensePoolId) {
        toast({ title: 'Error', description: 'Please select a license pool', variant: 'destructive' });
        return;
      }
      if (!allocationForm.userId) {
        toast({ title: 'Error', description: 'Please select a user', variant: 'destructive' });
        return;
      }
      if (!allocationForm.validFrom) {
        toast({ title: 'Error', description: 'Please select a valid from date', variant: 'destructive' });
        return;
      }

      setIsAllocatingLicense(true);
      
      const payload = {
        licensePoolId: parseInt(allocationForm.licensePoolId),
        userId: parseInt(allocationForm.userId),
        validFrom: allocationForm.validFrom,
        customValidityMonths: allocationForm.customValidityMonths ? parseInt(allocationForm.customValidityMonths) : undefined,
        notes: allocationForm.notes || undefined,
        autoRenew: allocationForm.autoRenew
      };

      
      await LicenseAllocationService.allocateLicense(payload);
      toast({ title: 'Success', description: 'License allocated successfully' });
      setShowAllocateDialog(false);
      setAllocationForm({ licensePoolId: '', userId: '', validFrom: new Date().toISOString().split('T')[0], customValidityMonths: '', notes: '', autoRenew: false });
      loadData();
    } catch (error) {
      console.error('Error allocating license:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to allocate license';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAllocatingLicense(false);
    }
  };

  const handleRevokeLicense = async () => {
    if (!selectedAllocation) {
      toast({ title: 'Error', description: 'No allocation selected', variant: 'destructive' });
      return;
    }

    try {
      setIsRevokingLicense(true);
      
      const payload = {
        reason: revokeForm.reason || 'No reason provided'
      };

      await LicenseAllocationService.revokeLicense(selectedAllocation.id, payload.reason);
      
      toast({ title: 'Success', description: 'License revoked successfully' });
      setShowRevokeDialog(false);
      setSelectedAllocation(null);
      setRevokeForm({ reason: '' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
      
    } catch (error) {
      console.error('Error revoking license:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke license';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsRevokingLicense(false);
    }
  };

  const handleRevokeClick = (allocation: LicenseAllocation) => {
    setSelectedAllocation(allocation);
    setShowRevokeDialog(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>License Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading license data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>License Management</CardTitle>
          <p className="text-sm text-gray-600">
            {(() => {
              const user = getCurrentUser();
              return `Manage license pools and allocations for ${user?.company || 'your company'}`;
            })()}
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pools">
            <TabsList>
              <TabsTrigger value="pools">License Pools</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pools">
              <div className="flex justify-end mb-4">
                <CommonButton 
                  onClick={() => setShowCreatePoolDialog(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Create License Pool
                </CommonButton>
              </div>
              
              {/* License Pools Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 bg-white shadow-sm rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Allocated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {licensePools.map(pool => (
                      <tr key={pool.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pool.poolName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{pool.licenseType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.totalLicenses}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.allocatedLicenses || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${pool.pricePerLicense}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${pool.totalAmount || (pool.totalLicenses * pool.pricePerLicense)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            pool.status === 'active' ? 'bg-green-100 text-green-800' : 
                            pool.status === 'expired' ? 'bg-red-100 text-red-800' : 
                            pool.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {pool.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {licensePools.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No license pools found. Create your first license pool to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Create Pool Dialog */}
              <Dialog open={showCreatePoolDialog} onOpenChange={setShowCreatePoolDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create License Pool</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pool Name *</Label>
                      <Input 
                        placeholder="Enter pool name" 
                        value={createPoolForm.poolName} 
                        onChange={e => setCreatePoolForm(f => ({ ...f, poolName: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>License Type</Label>
                      <Select 
                        value={createPoolForm.licenseType} 
                        onValueChange={value => setCreatePoolForm(f => ({ ...f, licenseType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select license type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Total Licenses *</Label>
                      <Input 
                        type="number" 
                        placeholder="Enter number of licenses" 
                        value={createPoolForm.totalLicenses} 
                        onChange={e => setCreatePoolForm(f => ({ ...f, totalLicenses: Number(e.target.value) }))} 
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Validity Period (months) *</Label>
                      <Input 
                        type="number" 
                        placeholder="Enter validity in months" 
                        value={createPoolForm.validityPeriodMonths} 
                        onChange={e => setCreatePoolForm(f => ({ ...f, validityPeriodMonths: Number(e.target.value) }))} 
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price per License ($) *</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Enter price per license" 
                        value={createPoolForm.pricePerLicense} 
                        onChange={e => setCreatePoolForm(f => ({ ...f, pricePerLicense: Number(e.target.value) }))} 
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Amount (Automatic)</Label>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <span className="text-lg font-semibold text-green-600">
                          ${totalAmount.toFixed(2)}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {createPoolForm.totalLicenses} licenses × ${createPoolForm.pricePerLicense} each
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea 
                        placeholder="Additional notes (optional)" 
                        value={createPoolForm.notes} 
                        onChange={e => setCreatePoolForm(f => ({ ...f, notes: e.target.value }))} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <CommonButton 
                      variant="outline" 
                      onClick={() => setShowCreatePoolDialog(false)}
                    >
                      Cancel
                    </CommonButton>
                    <CommonButton 
                      onClick={handleCreatePoolRequest}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Payment
                    </CommonButton>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Payment Dialog */}
              <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Complete Payment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900">Order Summary</h3>
                      <div className="mt-2 space-y-1 text-sm text-blue-800">
                        <p><strong>Pool:</strong> {createPoolForm.poolName}</p>
                        <p><strong>Licenses:</strong> {createPoolForm.totalLicenses}</p>
                        <p><strong>Type:</strong> {createPoolForm.licenseType}</p>
                        <p><strong>Validity:</strong> {createPoolForm.validityPeriodMonths} months</p>
                        <hr className="my-2 border-blue-300" />
                        <p className="text-lg font-semibold">
                          <strong>Total: ${totalAmount.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>
                    
                    <PaymentForm
                      amount={totalAmount}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      isProcessing={isProcessingPayment}
                      setIsProcessing={setIsProcessingPayment}
                    />
                    
                    {isCreatingPool && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Creating license pool...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-start gap-2 mt-4">
                    <CommonButton 
                      variant="outline" 
                      onClick={() => {
                        setShowPaymentDialog(false);
                        setShowCreatePoolDialog(true);
                      }}
                      disabled={isProcessingPayment || isCreatingPool}
                    >
                      Back to Form
                    </CommonButton>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="allocations">
              <div className="flex justify-end mb-4">
                <CommonButton 
                  onClick={() => setShowAllocateDialog(true)}
                >
                  + Allocate License
                </CommonButton>
              </div>
              
              {/* Allocations Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 bg-white shadow-sm rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Pool</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Valid From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Valid Until</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allocations.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{a.user?.email || a.userId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.licensePool?.poolName || a.licensePoolId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            a.status === 'active' ? 'bg-green-100 text-green-800' : 
                            a.status === 'expired' ? 'bg-red-100 text-red-800' : 
                            a.status === 'revoked' ? 'bg-gray-100 text-gray-800' :
                            a.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.validFrom ? new Date(a.validFrom).toLocaleDateString() : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.validUntil ? new Date(a.validUntil).toLocaleDateString() : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {a.status === 'active' || a.status === 'allocated' ? (
                            <CommonButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeClick(a)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              Revoke
                            </CommonButton>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {allocations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No license allocations found. Allocate licenses to users to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Allocate License Dialog */}
              <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Allocate License</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>License Pool</Label>
                      <Select 
                        value={allocationForm.licensePoolId} 
                        onValueChange={value => setAllocationForm(f => ({ ...f, licensePoolId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Pool" />
                        </SelectTrigger>
                        <SelectContent>
                          {licensePools
                            .filter(pool => pool.status === 'active' && (pool.availableLicenses || pool.totalLicenses - (pool.allocatedLicenses || 0)) > 0)
                            .length === 0 ? (
                            <SelectItem value="no-pools" disabled>
                              No available license pools
                            </SelectItem>
                          ) : (
                            licensePools
                              .filter(pool => pool.status === 'active' && (pool.availableLicenses || pool.totalLicenses - (pool.allocatedLicenses || 0)) > 0)
                              .map(pool => (
                              <SelectItem key={pool.id} value={String(pool.id)}>
                                {pool.poolName} ({(pool.availableLicenses || pool.totalLicenses - (pool.allocatedLicenses || 0))} available)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>User</Label>
                      <Select 
                        value={allocationForm.userId} 
                        onValueChange={value => setAllocationForm(f => ({ ...f, userId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select User" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={String(user.id)}>{user.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valid From</Label>
                      <Input 
                        type="date" 
                        value={allocationForm.validFrom} 
                        onChange={e => setAllocationForm(f => ({ ...f, validFrom: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custom Validity (months)</Label>
                      <Input 
                        type="number" 
                        placeholder="Custom Validity (months)" 
                        value={allocationForm.customValidityMonths} 
                        onChange={e => setAllocationForm(f => ({ ...f, customValidityMonths: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea 
                        placeholder="Notes" 
                        value={allocationForm.notes} 
                        onChange={e => setAllocationForm(f => ({ ...f, notes: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="autoRenew"
                          checked={allocationForm.autoRenew}
                          onChange={e => setAllocationForm(f => ({ ...f, autoRenew: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="autoRenew">Auto-renew license</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <CommonButton 
                      variant="outline" 
                      onClick={() => setShowAllocateDialog(false)}
                      disabled={isAllocatingLicense}
                    >
                      Cancel
                    </CommonButton>
                    <CommonButton 
                      onClick={handleAllocateLicense}
                      disabled={isAllocatingLicense}
                    >
                      {isAllocatingLicense ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Allocating...
                        </>
                      ) : (
                        'Allocate'
                      )}
                    </CommonButton>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Revoke License Dialog */}
              <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Revoke License</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {selectedAllocation && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h3 className="font-semibold text-red-900">License Details</h3>
                        <div className="mt-2 space-y-1 text-sm text-red-800">
                          <p><strong>User:</strong> {selectedAllocation.user?.email || selectedAllocation.userId}</p>
                          <p><strong>Pool:</strong> {selectedAllocation.licensePool?.poolName || selectedAllocation.licensePoolId}</p>
                          <p><strong>Status:</strong> {selectedAllocation.status}</p>
                          <p><strong>Valid Until:</strong> {selectedAllocation.validUntil ? new Date(selectedAllocation.validUntil).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>Reason for Revocation</Label>
                      <Textarea 
                        placeholder="Enter reason for revoking this license..." 
                        value={revokeForm.reason} 
                        onChange={e => setRevokeForm(f => ({ ...f, reason: e.target.value }))} 
                        rows={3}
                      />
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> This action cannot be undone. The user will immediately lose access to the system.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <CommonButton 
                      variant="outline" 
                      onClick={() => {
                        setShowRevokeDialog(false);
                        setSelectedAllocation(null);
                        setRevokeForm({ reason: '' });
                      }}
                      disabled={isRevokingLicense}
                    >
                      Cancel
                    </CommonButton>
                    <CommonButton 
                      onClick={handleRevokeLicense}
                      disabled={isRevokingLicense}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isRevokingLicense ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Revoking...
                        </>
                      ) : (
                        'Revoke License'
                      )}
                    </CommonButton>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicensingAdminPage; 