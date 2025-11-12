import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Client } from '../types';
import CloseButton from './CloseButton';

interface CallHistoryModalProps {
  client: Client | null;
  onClose: () => void;
}

const CallHistoryModal: React.FC<CallHistoryModalProps> = ({ client, onClose }) => {
  const { t } = useTranslation();

  if (!client) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold dark:text-gray-100">{t('callHistory.title')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{client.companyName}</p>
          </div>
          <CloseButton onClose={onClose} />
        </div>
        
        <div className="p-6 max-h-80 overflow-y-auto">
          {client.followUps.length > 0 ? (
            <ul className="space-y-3">
              {client.followUps.slice().reverse().map(followUp => (
                <li key={followUp.id} className="text-sm text-gray-700 dark:text-gray-300 border-l-2 border-green-500 pl-3">
                  {new Date(followUp.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('callHistory.noCalls')}</p>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-right">
            <button
                onClick={onClose}
                className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default CallHistoryModal;