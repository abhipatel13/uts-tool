import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { NotificationApi } from '@/services';
import type { Notification } from '@/types';
import {
  NOTIFICATION_EVENTS,
  emitNotificationEvent,
  getEventForNotificationType,
  subscribeToNotificationEvent,
  type NotificationEventType,
} from '@/lib/notificationEvents';

/** Query key for notifications */
export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

/** Default polling interval in milliseconds (60 seconds) */
const DEFAULT_REFETCH_INTERVAL = 60 * 1000;

interface UseNotificationsOptions {
  /** Whether to only return unread notifications */
  unreadOnly?: boolean;
  /** Custom refetch interval in ms (default: 60000) */
  refetchInterval?: number;
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean;
  /** Whether to emit events for new notifications (default: false) */
  emitEvents?: boolean;
}

interface UseNotificationsResult {
  /** All notifications (or unread only based on options) */
  notifications: Notification[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Whether the query is loading */
  isLoading: boolean;
  /** Whether the query is fetching (includes background refetches) */
  isFetching: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Manually refetch notifications */
  refetch: () => void;
  /** Mark a notification as read and update cache */
  markAsRead: (notificationId: number) => Promise<void>;
}

/**
 * Hook for managing notifications with React Query
 * 
 * Features:
 * - Automatic polling with configurable interval
 * - Shared cache across components
 * - Event emission for new notifications
 * - Optimistic updates for mark-as-read
 * - Background refetching on window focus
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsResult {
  const {
    unreadOnly = false,
    refetchInterval = DEFAULT_REFETCH_INTERVAL,
    enablePolling = true,
    emitEvents = false,
  } = options;

  const queryClient = useQueryClient();
  
  // Track notification IDs we've already emitted events for
  const emittedIdsRef = useRef<Set<number>>(new Set());
  // Track previous notification IDs to detect new ones
  const previousIdsRef = useRef<Set<number>>(new Set());

  const {
    data: allNotifications = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await NotificationApi.getMyNotifications();
      return response.data;
    },
    refetchInterval: enablePolling ? refetchInterval : false,
    refetchOnWindowFocus: true,
  });

  // Emit events for new notifications
  useEffect(() => {
    if (!emitEvents || allNotifications.length === 0) return;

    const currentIds = new Set(allNotifications.map(n => n.id));
    
    // Find truly new notifications (not seen before)
    const newNotifications = allNotifications.filter(n => {
      const isNew = !previousIdsRef.current.has(n.id) && 
                    !emittedIdsRef.current.has(n.id);
      return isNew;
    });

    if (newNotifications.length > 0) {
      // Emit general new notification event
      emitNotificationEvent(NOTIFICATION_EVENTS.NEW_NOTIFICATION, {
        count: newNotifications.length,
        notifications: newNotifications,
      });

      // Emit type-specific events
      newNotifications.forEach(notification => {
        if (notification.type) {
          const specificEvent = getEventForNotificationType(notification.type);
          if (specificEvent) {
            emitNotificationEvent(specificEvent, notification);
          }
        }
        // Mark as emitted
        emittedIdsRef.current.add(notification.id);
      });
    }

    // Update previous IDs for next comparison
    previousIdsRef.current = currentIds;
  }, [allNotifications, emitEvents]);

  // Filter based on options
  const notifications = unreadOnly
    ? allNotifications.filter(n => !n.isRead)
    : allNotifications;

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  // Mark notification as read with optimistic update
  const markAsRead = useCallback(async (notificationId: number) => {
    // Optimistic update - immediately update UI
    queryClient.setQueryData<Notification[]>(
      NOTIFICATIONS_QUERY_KEY,
      (old) => old?.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );

    try {
      await NotificationApi.markAsRead(notificationId);
    } catch (error) {
      // Revert on error by refetching
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      throw error;
    }
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
    markAsRead,
  };
}

/**
 * Hook to subscribe to notification events and trigger refetch
 * 
 * Use this in pages that need to refresh when specific notification types arrive
 */
export function useNotificationEventListener(
  eventType: NotificationEventType,
  onEvent?: (event: CustomEvent) => void
): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToNotificationEvent(eventType, (event) => {
      // Invalidate notifications cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      
      // Call custom handler if provided
      onEvent?.(event);
    });

    return unsubscribe;
  }, [eventType, onEvent, queryClient]);
}

/**
 * Utility to invalidate notifications cache from anywhere
 */
export function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
  }, [queryClient]);
}

