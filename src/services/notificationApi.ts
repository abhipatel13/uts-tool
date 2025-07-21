import { api } from '@/lib/api-client';
import { ApiResponse, Notification } from '@/types';

export const NotificationApi = {
  // Get user's notifications
  getMyNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    return api.get<ApiResponse<Notification[]>>('/api/notifications/my-notifications');
  },

  // Mark notification as read
  markAsRead: async (notificationId: number): Promise<ApiResponse<void>> => {
    return api.put<ApiResponse<void>>(`/api/notifications/${notificationId}/mark-read`);
  },
}; 