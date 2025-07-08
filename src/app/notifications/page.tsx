'use client';

import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { notificationApi, type Notification } from '../../services/api';
import { BackButtonVariants } from '@/components/ui/back-button';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationApi.getMyNotifications();
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;

  const getTypeColor = (type?: string) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    switch (type) {
      case 'payment':
        return 'bg-blue-100 text-blue-800';
      case 'approval':
        return 'bg-amber-100 text-amber-800';
      case 'risk':
        return 'bg-red-100 text-red-800';
      case 'task':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderDesktopTable = (notificationsList: Notification[]) => {
    if (notificationsList.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
          <div className="p-8 text-center text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
              </div>
              <div className="text-sm">You&apos;re all caught up!</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto min-w-[600px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Type</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm">Title</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm hidden lg:table-cell">Message</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Time</th>
                <th className="text-left p-3 sm:p-4 text-[#2C3E50] font-medium text-sm whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {notificationsList.map((notification) => (
                <tr 
                  key={notification.id} 
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                      {notification.type}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                  </td>
                  <td className="p-3 sm:p-4 hidden lg:table-cell">
                    <div className="text-sm text-gray-600 line-clamp-2 max-w-md">{notification.message}</div>
                  </td>
                  <td className="p-3 sm:p-4 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </td>
                  <td className="p-3 sm:p-4">
                    {!notification.isRead ? (
                      <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">New</Badge>
                    ) : (
                      <span className="text-sm text-gray-500">Read</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMobileCards = (notificationsList: Notification[]) => {
    if (notificationsList.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg">
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
            </div>
            <div className="text-sm">You&apos;re all caught up!</div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {notificationsList.map((notification) => (
          <div 
            key={notification.id} 
            className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleNotificationClick(notification)}
          >
            {/* Header with Type and Status */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                  {notification.type}
                </span>
                {!notification.isRead && (
                  <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-xs">New</Badge>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-2">
              <div>
                <div className="text-sm font-semibold text-[#2C3E50] mb-1">
                  {notification.title}
                </div>
                <div className="text-sm text-gray-600">
                  {notification.message}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-4 sm:mb-6">
          <BackButtonVariants.Dashboard />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A3FF]"></div>
            <span>Loading notifications...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <BackButtonVariants.Dashboard />
      </div>
      
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50] mb-4">Notifications</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block">
              {renderDesktopTable(notifications)}
            </div>
            
            {/* Mobile Card View */}
            <div className="block md:hidden">
              {renderMobileCards(notifications)}
            </div>
          </TabsContent>
          
          <TabsContent value="unread" className="mt-0">
            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block">
              {renderDesktopTable(unreadNotifications)}
            </div>
            
            {/* Mobile Card View */}
            <div className="block md:hidden">
              {renderMobileCards(unreadNotifications)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 