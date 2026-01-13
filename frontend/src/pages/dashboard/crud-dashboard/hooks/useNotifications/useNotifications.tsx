import * as React from 'react';
import NotificationsContext, {
  type ShowNotification,
  type CloseNotification,
} from './NotificationsContext';

export type {
  ShowNotification,
  CloseNotification,
  ShowNotificationOptions,
} from './NotificationsContext';

interface UseNotifications {
  show: ShowNotification;
  close: CloseNotification;
}

export default function useNotifications(): UseNotifications {
  const notificationsContext = React.useContext(NotificationsContext);
  if (!notificationsContext) {
    throw new Error('Notifications context was used without a provider.');
  }
  return notificationsContext;
}
