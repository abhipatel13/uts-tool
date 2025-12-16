// Centralized notification types

export interface Notification {
  id: number;
  title: string;
  message: string;
  type?: 'license' | 'payment' | 'system' | 'other' | 'approval' | 'risk' | 'hazard';
  isRead: boolean;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}