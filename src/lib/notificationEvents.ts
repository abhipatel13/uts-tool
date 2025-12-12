/**
 * Notification Event System
 * 
 * Lightweight pub/sub system for cross-component communication.
 * Used to notify pages when new notifications arrive so they can
 * refetch their data without polling.
 */

export const NOTIFICATION_EVENTS = {
  /** Fired when any new notification arrives */
  NEW_NOTIFICATION: 'uts:new-notification',
  /** Fired specifically for approval-related notifications */
  APPROVAL_NOTIFICATION: 'uts:approval-notification',
  /** Fired for risk assessment notifications */
  RISK_NOTIFICATION: 'uts:risk-notification',
  /** Fired for task hazard notifications */
  TASK_NOTIFICATION: 'uts:task-notification',
} as const;

export type NotificationEventType = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];

/**
 * Emit a notification event that other components can listen for
 */
export const emitNotificationEvent = (
  eventType: NotificationEventType, 
  data?: unknown
): void => {
  if (typeof window === 'undefined') return;
  
  window.dispatchEvent(
    new CustomEvent(eventType, { detail: data })
  );
};

/**
 * Subscribe to a notification event
 * @returns Cleanup function to unsubscribe
 */
export const subscribeToNotificationEvent = (
  eventType: NotificationEventType,
  handler: (event: CustomEvent) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const eventHandler = handler as EventListener;
  window.addEventListener(eventType, eventHandler);
  
  return () => {
    window.removeEventListener(eventType, eventHandler);
  };
};

/**
 * Map notification types to their corresponding events
 */
export const getEventForNotificationType = (
  notificationType: string
): NotificationEventType | null => {
  switch (notificationType) {
    case 'approval':
      return NOTIFICATION_EVENTS.APPROVAL_NOTIFICATION;
    case 'risk':
      return NOTIFICATION_EVENTS.RISK_NOTIFICATION;
    case 'task':
      return NOTIFICATION_EVENTS.TASK_NOTIFICATION;
    default:
      return null;
  }
};

