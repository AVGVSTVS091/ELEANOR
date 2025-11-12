import React from 'react';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowPathIcon } from './Icons';
import CloseButton from './CloseButton';

interface HostManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HostManagementPanel: React.FC<HostManagementPanelProps> = ({ isOpen, onClose }) => {
  const { settings, regeneratePin, removeUser, blockUser, unblockUser, stopHostSession } = useSettings();
  const { t } = useTranslation();

  const handleRegenerate = () => {
    if (window.confirm(t('hostPanel.regenerate.confirm'))) {
      regeneratePin();
    }
  };

  const handleRemove = (user: { id: string, name: string }) => {
    if (window.confirm(t('hostPanel.removeUser', { name: user.name }))) {
      removeUser(user.id);
    }
  }

  const handleBlock = (user: { id: string, name: string }) => {
    if (window.confirm(t('hostPanel.removeAndBlockUser', { name: user.name }))) {
      blockUser(user.id);
    }
  }
  
  const handleStopHosting = () => {
    if (window.confirm(t('hostPanel.stopHosting.confirm'))) {
        stopHostSession();
        onClose();
    }
  }
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold dark:text-gray-100">{t('hostPanel.title')}</h2>
          <CloseButton onClose={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* PIN Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('hostPanel.pin')}</h3>
            <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="flex-1 text-center text-3xl font-bold tracking-widest text-gray-800 dark:text-gray-100">{settings.hostPin}</p>
              <button onClick={handleRegenerate} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title={t('hostPanel.regenerate')}>
                <ArrowPathIcon className="w-5 h-5 text-green-600 dark:text-indigo-400" />
              </button>
            </div>
          </div>
          
          {/* Connected Users */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('hostPanel.connectedUsers')} ({settings.connectedUsers.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto p-1">
              {settings.connectedUsers.length > 0 ? settings.connectedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="text-sm font-medium">{user.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleBlock(user)} className="text-xs text-red-600 hover:underline">{t('multiClientForm.overwrite')}</button>
                    <button onClick={() => handleRemove(user)} className="text-xs text-gray-600 hover:underline">{t('followUp.delete')}</button>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500 italic px-2">{t('hostPanel.noConnectedUsers')}</p>}
            </div>
          </div>

          {/* Blocked Users */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('hostPanel.blockedUsers')} ({settings.blockedUsers.length})</h3>
             <div className="space-y-2 max-h-40 overflow-y-auto p-1">
              {settings.blockedUsers.length > 0 ? settings.blockedUsers.map(userId => (
                <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="text-sm font-medium italic">User {userId.substring(5, 9)}</span>
                  <button onClick={() => unblockUser(userId)} className="text-xs text-green-600 hover:underline">{t('hostPanel.unblock')}</button>
                </div>
              )) : <p className="text-sm text-gray-500 italic px-2">{t('hostPanel.noBlockedUsers')}</p>}
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
                onClick={handleStopHosting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium"
            >
                {t('hostPanel.stopHosting')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default HostManagementPanel;