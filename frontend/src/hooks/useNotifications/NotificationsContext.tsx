import * as React from 'react';

export interface ShowNotificationOptions {
  key?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  autoHideDuration?: number;
  actionText?: React.ReactNode;
  onAction?: () => void;
}

export interface ShowNotification {
  (message: React.ReactNode, options?: ShowNotificationOptions): string;
}

export interface CloseNotification {
  (key: string): void;
}

const NotificationsContext = React.createContext<{
  show: ShowNotification;
  close: CloseNotification;
} | null>(null);

export default NotificationsContext;
