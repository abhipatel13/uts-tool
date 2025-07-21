// Centralized notification types

export interface Notification {
  id: number;
  title: string;
  message: string;
  type?: 'license' | 'payment' | 'system' | 'other' | 'approval' | 'risk' | 'task';
  isRead: boolean;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}