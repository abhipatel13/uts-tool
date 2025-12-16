'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNotifications, useNotificationEventListener } from '@/hooks/useNotifications';
import { NOTIFICATION_EVENTS } from '@/lib/notificationEvents';
import { CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications({
    unreadOnly: false,
    enablePolling: true,
  });

  // Listen for new notifications and refetch
  useNotificationEventListener(NOTIFICATION_EVENTS.NEW_NOTIFICATION, () => {
    refetch();
  });

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const getNavigationConfig = (type?: string) => {
    switch (type) {
      case 'approval':
        return { path: '/safety/supervisor-dashboard', label: 'Go to Supervisor Dashboard' };
      case 'risk':
        return { path: '/safety/risk-assessment', label: 'Go to Risk Assessments' };
      case 'hazard':
        return { path: '/safety/task-hazard', label: 'Go to Task Hazards' };
      default:
        return null;
    }
  };

  const handleNavigateToPage = () => {
    const navConfig = getNavigationConfig(selectedNotification?.type);
    if (navConfig) {
      setSelectedNotification(null);
      router.push(navConfig.path);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);

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

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A3FF]"></div>
            <span>Loading notifications...</span>
          </div>
        </div>
      </div>
    );
  }

  const navConfig = getNavigationConfig(selectedNotification?.type);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
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
            {/* Mark All as Read Button */}
            {unreadCount > 0 && (
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllRead}
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  {isMarkingAllRead ? 'Marking...' : 'Mark All as Read'}
                </Button>
              </div>
            )}
            
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

      {/* Notification Detail Modal */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedNotification?.type)}`}>
                {selectedNotification?.type || 'notification'}
              </span>
              {selectedNotification && !selectedNotification.isRead && (
                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-xs">New</Badge>
              )}
            </div>
            <DialogTitle className="text-[#2C3E50]">{selectedNotification?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {selectedNotification?.message}
            </p>
            
            <div className="text-xs text-gray-500">
              {selectedNotification && formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {navConfig && (
              <Button onClick={handleNavigateToPage} className="w-full sm:w-auto">
                {navConfig.label}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setSelectedNotification(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
