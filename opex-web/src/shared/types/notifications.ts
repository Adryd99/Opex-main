export type NotificationKind = 'success' | 'warning' | 'info' | 'danger';

export interface NotificationRecord {
  id: string;
  unread: boolean;
  type: NotificationKind;
  title: string;
  description: string;
  time: string;
  createdAt: string;
  icon: string;
}
