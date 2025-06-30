"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, CreditCard, AlertTriangle } from "lucide-react";
import { getCurrentUser } from "@/utils/auth";
import Link from "next/link";

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  validUntil: string | null;
  lastPaymentAmount: number | null;
}

interface User {
  id: string;
  email: string;
  role: string;
}

export function SubscriptionReminder() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setCurrentUser(user);
        
        setSubscriptionStatus({
          hasActiveSubscription: false,
          validUntil: null,
          lastPaymentAmount: null
        });
        setIsVisible(true);
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setIsVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, []);

  const getDaysUntilExpiry = () => {
    if (!subscriptionStatus?.validUntil) return 0;
    const today = new Date();
    const expiryDate = new Date(subscriptionStatus.validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('subscription-reminder-dismissed', Date.now().toString());
  };

  if (isLoading || !currentUser) {
    return null;
  }

  const lastDismissed = localStorage.getItem('subscription-reminder-dismissed');
  if (lastDismissed) {
    const dismissedTime = parseInt(lastDismissed);
    const hoursAgo = (Date.now() - dismissedTime) / (1000 * 60 * 60);
    if (hoursAgo < 24) {
      return null;
    }
  }

  if (!isVisible || (subscriptionStatus?.hasActiveSubscription)) return null;

  const daysLeft = getDaysUntilExpiry();
  const isExpired = daysLeft <= 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;

  return (
    <div className="mx-4 mb-4 border border-orange-200 bg-orange-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
          <div>
            <span className="font-medium text-orange-800">
              {isExpired 
                ? "Your subscription has expired!" 
                : isExpiringSoon 
                ? `Your subscription expires in ${daysLeft} days`
                : "You don't have an active subscription"}
            </span>
            <span className="text-orange-700 ml-2">
              Subscribe now to continue using all features.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Link href="/admin/payments">
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
              <CreditCard className="h-4 w-4 mr-1" />
              Subscribe Now
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 