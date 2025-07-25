"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommonButton } from "@/components/ui/common-button"
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const LicenseManagementPage = () => {
  // Removed unused currentUser
  const [licensePools, setLicensePools] = useState<LicensePool[]>([]);
  const [allocations, setAllocations] = useState<LicenseAllocation[]>([]);
  const [analytics, setAnalytics] = useState<LicenseAnalytics | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePoolDialog, setShowCreatePoolDialog] = useState(false);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);

  // Form states
  const [createPoolForm, setCreatePoolForm] = useState({
    poolName: '',
    licenseType: 'monthly',
    totalLicenses: 5,
    validityPeriodMonths: 1,
    totalAmount: 99.99,
    pricePerLicense: 19.99,
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

  const handleCreatePool = async () => {
    try {
      await LicensePoolService.createLicensePool(createPoolForm);

      toast({
        title: "Success",
        description: "License pool created successfully"
      });

      setShowCreatePoolDialog(false);
      setCreatePoolForm({
        poolName: '',
        licenseType: 'monthly',
        totalLicenses: 5,
        validityPeriodMonths: 1,
        totalAmount: 99.99,
        pricePerLicense: 19.99,
        notes: ''
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
        customValidityMonths: allocationForm.customValidityMonths ? parseInt(allocationForm.customValidityMonths) : undefined,
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
        customValidityMonths: '',
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
  
          <h1 className="text-3xl font-bold text-[rgb(44,62,80)] mt-4">License Management</h1>
          <p className="text-gray-600 mt-2">
            {(() => {
              const user = getCurrentUser();
              return `Manage license pools and allocations for ${user?.company?.name || 'your company'}`;
            })()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showCreatePoolDialog} onOpenChange={setShowCreatePoolDialog}>
            <DialogTrigger asChild>
              <CommonButton>
                <Package className="w-4 h-4 mr-2" />
                Create License Pool
              </CommonButton>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create License Pool</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="poolName">Pool Name</Label>
                  <Input
                    id="poolName"
                    value={createPoolForm.poolName}
                    onChange={(e) => setCreatePoolForm({...createPoolForm, poolName: e.target.value})}
                    placeholder="Enter pool name"
                  />
                </div>

                <div>
                  <Label htmlFor="licenseType">License Type</Label>
                  <Select
                    value={createPoolForm.licenseType}
                    onValueChange={(value) => setCreatePoolForm({...createPoolForm, licenseType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalLicenses">Total Licenses</Label>
                    <Input
                      id="totalLicenses"
                      type="number"
                      min="1"
                      value={createPoolForm.totalLicenses}
                      onChange={(e) => setCreatePoolForm({...createPoolForm, totalLicenses: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validityPeriodMonths">Validity (Months)</Label>
                    <Input
                      id="validityPeriodMonths"
                      type="number"
                      min="1"
                      value={createPoolForm.validityPeriodMonths}
                      onChange={(e) => setCreatePoolForm({...createPoolForm, validityPeriodMonths: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalAmount">Total Amount ($)</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={createPoolForm.totalAmount}
                      onChange={(e) => setCreatePoolForm({...createPoolForm, totalAmount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricePerLicense">Price per License ($)</Label>
                    <Input
                      id="pricePerLicense"
                      type="number"
                      step="0.01"
                      min="0"
                      value={createPoolForm.pricePerLicense}
                      onChange={(e) => setCreatePoolForm({...createPoolForm, pricePerLicense: parseFloat(e.target.value)})}
                    />
                  </div>
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
                  <Button onClick={handleCreatePool}>
                    Create Pool
                  </Button>
                </div>
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
                      {users.map(user => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="customValidityMonths">Custom Validity (months, optional)</Label>
                  <Input
                    id="customValidityMonths"
                    type="number"
                    min="1"
                    placeholder="Use pool default if empty"
                    value={allocationForm.customValidityMonths}
                    onChange={(e) => setAllocationForm({...allocationForm, customValidityMonths: e.target.value})}
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

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <Tabs defaultValue="pools" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pools">License Pools</TabsTrigger>
          <TabsTrigger value="allocations">License Allocations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pools" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">License Pools</h2>
            <CommonButton onClick={() => setShowCreatePoolDialog(true)}>
              <Package className="w-4 h-4 mr-2" />
              Create License Pool
            </CommonButton>
          </div>
          <div className="bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {licensePools.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No license pools found</td>
                  </tr>
                ) : (
                  licensePools.map((pool) => (
                    <tr key={pool.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{pool.poolName}</td>
                      <td className="px-6 py-4">{pool.licenseType}</td>
                      <td className="px-6 py-4">{pool.totalLicenses}</td>
                      <td className="px-6 py-4">{pool.allocatedLicenses}</td>
                      <td className="px-6 py-4">{formatCurrency(pool.pricePerLicense)}</td>
                      <td className="px-6 py-4">{pool.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          <div className="bg-white rounded-lg shadow h-[calc(100vh-200px)]">
            <div className="h-full flex flex-col">
              <div className="flex-none">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allocations.map((allocation) => {
                      const daysRemaining = getDaysUntilExpiry(allocation.validUntil);
                      return (
                        <tr key={allocation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium">{allocation.user?.name}</div>
                              <div className="text-sm text-gray-500">{allocation.user?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{allocation.licensePool?.poolName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${allocation.status === 'active' ? 'bg-green-100 text-green-800' : allocation.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'}`}>{allocation.status}</span>
                          </td>
                          <td className="px-6 py-4">{formatDate(allocation.validFrom)}</td>
                          <td className="px-6 py-4">{formatDate(allocation.validUntil)}</td>
                          <td className="px-6 py-4">
                            <span className={daysRemaining <= 7 ? 'text-red-600 font-medium' : daysRemaining <= 30 ? 'text-orange-600' : ''}>
                              {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              {allocation.status === 'active' && (
                                <CommonButton
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRevokeLicense(allocation.id, 'Revoked by admin')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </CommonButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
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
        </TabsContent>
      </Tabs>

      {/* Pool Details Dialog */}
      {/* Removed Pool Details Dialog */}
    </div>
  );
};

export default LicenseManagementPage; 