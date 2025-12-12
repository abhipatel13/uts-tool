import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/types';

/**
 * NotificationBell Component
 * 
 * Displays a bell icon with unread notification count and dropdown.
 * Uses React Query for data fetching with automatic polling.
 * Emits events when new notifications arrive for other pages to react.
 */
const NotificationBell: React.FC = () => {
  const router = useRouter();
  
  const {
    notifications,
    unreadCount,
    markAsRead,
  } = useNotifications({
    unreadOnly: true,
    enablePolling: true,
    emitEvents: true, // This component is responsible for emitting events
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    if (!notification.type) return;
    switch (notification.type) {
      case 'payment':
        break;
      case 'approval':
        router.push('/safety/supervisor-dashboard');
        break;
      case 'risk':
        router.push('/safety/risk-assessment');
        break;
      case 'task':
        router.push('/safety/task-hazard');
        break;
      default:
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">No unread notifications</span>
          </DropdownMenuItem>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`block p-3 cursor-pointer ${
                  notification.isRead ? '' : 'bg-muted/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{notification.title}</span>
                    {!notification.isRead && (
                      <Badge variant="default" className="h-2 w-2 p-0 rounded-full bg-blue-500"></Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/notifications')} className="text-sm text-muted-foreground">
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
