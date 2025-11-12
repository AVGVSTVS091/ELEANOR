import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { AppNotification } from '../types';
import { BellIcon } from './Icons';
import CloseButton from './CloseButton';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onNotificationClick: (notification: AppNotification) => void;
  onClearAll: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationClick,
  onClearAll,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-heading"
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 id="notifications-heading" className="text-lg font-semibold flex items-center gap-2">
              <BellIcon className="w-6 h-6" />
              {t('notifications.title')}
            </h2>
            <CloseButton onClose={onClose} />
          </header>

          <div className="flex-1 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul>
                {notifications.map(notification => (
                  <li key={notification.id} className="border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => onNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${!notification.isRead ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                    >
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4 text-center">
                <BellIcon className="w-12 h-12 mb-4" />
                <p>{t('notifications.noNotifications')}</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClearAll}
                className="w-full py-2 px-4 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
              >
                {t('notifications.clearAll')}
              </button>
            </footer>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPanel;