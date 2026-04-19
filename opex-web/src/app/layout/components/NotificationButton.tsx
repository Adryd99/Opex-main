import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NotificationRecord } from '../../../shared/types';
import { opexApi } from '../../../services/api/opexApi';
import { ICON_MAP } from '../support';

export const NotificationButton = () => {
  const { t } = useTranslation('app');
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await opexApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const markAsRead = async (id: string) => {
    try {
      await opexApi.markNotificationAsRead(id);
      setNotifications((previous) =>
        previous.map((notification) => (notification.id === id ? { ...notification, unread: false } : notification))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await opexApi.markAllNotificationsAsRead();
      setNotifications((previous) => previous.map((notification) => ({ ...notification, unread: false })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 border border-gray-100 transition-all ${isOpen ? 'bg-gray-50 border-opex-teal' : 'bg-white'}`}
      >
        <Bell size={20} className={isOpen ? 'text-opex-teal' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 py-4 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-6 py-2 border-b border-gray-50 flex items-center justify-between mb-2">
            <h3 className="font-black text-gray-900 tracking-tight">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline"
              >
                {t('notifications.markAsRead')}
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto no-scrollbar px-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">{t('notifications.noNotifications')}</div>
            ) : (
              notifications.map((notification) => {
                const Icon = ICON_MAP[notification.icon] || Bell;
                return (
                  <div
                    key={notification.id}
                    onClick={() => void markAsRead(notification.id)}
                    className={`p-4 flex gap-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group ${notification.unread ? 'bg-opex-teal/[0.02]' : ''}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notification.type === 'warning'
                          ? 'bg-orange-100 text-orange-600'
                          : notification.type === 'danger'
                            ? 'bg-red-100 text-red-600'
                            : notification.type === 'success'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-bold leading-none mb-1 ${notification.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{notification.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed truncate-2-lines">{notification.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-6 pt-4 border-t border-gray-50 mt-2">
            <button
              type="button"
              className="w-full py-3 bg-gray-50 rounded-xl text-xs font-black text-gray-400 hover:text-opex-teal transition-colors"
            >
              {t('notifications.viewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
