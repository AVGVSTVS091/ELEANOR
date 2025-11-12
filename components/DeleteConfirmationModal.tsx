import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import CloseButton from './CloseButton';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  count: number;
  taskTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, count, taskTitle, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
        <CloseButton onClose={onCancel} className="absolute top-2 right-2" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6 mt-2">
          {count === 1 
            ? t('tasks.deleteConfirm.single', { title: taskTitle || 'this task' }) 
            : t('tasks.deleteConfirm.bulk', { count })}
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {t('tasks.deleteConfirm.cancel')}
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {t('tasks.deleteConfirm.yesDelete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;