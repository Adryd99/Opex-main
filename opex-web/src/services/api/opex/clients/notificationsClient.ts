import { NotificationRecord } from '../../../../shared/types';
import { request } from '../http';
import { normalizeNotifications } from '../normalizers/notifications';

type BackendNotificationPayload = {
  id: string;
  type: string;
  title: string;
  description: string;
  unread: boolean;
  createdAt: string;
  icon: string;
};

export const notificationsClient = {
  getNotifications: async (): Promise<NotificationRecord[]> =>
    normalizeNotifications(await request<BackendNotificationPayload[]>('/api/notifications')),

  markNotificationAsRead: (id: string) =>
    request<void>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsAsRead: () =>
    request<void>('/api/notifications/read-all', { method: 'PATCH' })
};
