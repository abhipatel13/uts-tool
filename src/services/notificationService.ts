import axios from 'axios';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'payment' | 'system' | 'other';
  isRead: boolean;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

const notificationService = {
  getMyNotifications: async (): Promise<Notification[]> => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/my-notifications`);
    return response.data.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/mark-read`);
  },
};

export default notificationService; 