import { NotificationKind, NotificationRecord } from '../../../../shared/types';
import { toStringValue } from './support';

const toNotificationKind = (value: unknown): NotificationKind => {
  const supportedKinds: NotificationKind[] = ['success', 'warning', 'info', 'danger'];
  return supportedKinds.find((kind) => kind === value) ?? 'info';
};

export const normalizeNotification = (payload: {
  id: string;
  type: string;
  title: string;
  description: string;
  unread: boolean;
  createdAt: string;
  icon: string;
}): NotificationRecord => {
  const createdAt = toStringValue(payload.createdAt, new Date().toISOString());
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  let time = 'now';
  if (diffMin < 1) {
    time = 'now';
  } else if (diffMin < 60) {
    time = `${diffMin}m`;
  } else if (diffHours < 24) {
    time = `${diffHours}h`;
  } else {
    time = `${diffDays}d`;
  }

  return {
    id: toStringValue(payload.id, ''),
    unread: Boolean(payload.unread),
    type: toNotificationKind(payload.type),
    title: toStringValue(payload.title, ''),
    description: toStringValue(payload.description, ''),
    time,
    createdAt,
    icon: toStringValue(payload.icon, 'Bell')
  };
};

export const normalizeNotifications = (
  payload: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    unread: boolean;
    createdAt: string;
    icon: string;
  }> | null | undefined
): NotificationRecord[] => (payload ?? []).map(normalizeNotification);
