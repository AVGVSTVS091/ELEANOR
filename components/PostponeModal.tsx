import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import CloseButton from './CloseButton';

interface PostponeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newDate: string | null) => void;
  title: string;
}

const PostponeModal: React.FC<PostponeModalProps> = ({ isOpen, onClose, onSave, title }) => {
  const { t } = useTranslation();
  const [newDate, setNewDate] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(newDate ? new Date(newDate).toISOString() : new Date().toISOString());
    onClose();
  };
  
  const handleReset = () => {
    onSave(null); // Signal to reset to default
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
        <CloseButton onClose={onClose} className="absolute top-4 right-4" />
        <h2 className="text-xl font-bold mb-4 dark:text-gray-100 pr-8">{title}</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('postponeModal.newDateTime')}
            </label>
            <input
              type="datetime-local"
              id="datetime"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            onClick={handleReset}
            className="w-full text-center py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500"
          >
            {t('postponeModal.reset')}
          </button>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">
            {t('clientForm.cancel')}
          </button>
          <button type="button" onClick={handleSave} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">
            {t('clientForm.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostponeModal;