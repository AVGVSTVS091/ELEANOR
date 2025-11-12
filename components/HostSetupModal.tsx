import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useSettings } from '../hooks/useSettings';
import CloseButton from './CloseButton';

interface HostSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HostSetupModal: React.FC<HostSetupModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { startHostSession } = useSettings();

  const handleConfirm = () => {
    startHostSession();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-[51] flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
        <CloseButton onClose={onClose} className="absolute top-3 right-3" />
        <h2 className="text-xl font-bold dark:text-gray-100">{t('hostSetup.confirm.title')}</h2>
        <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">{t('clientForm.cancel')}</button>
            <button onClick={handleConfirm} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">{t('hostSetup.confirm.confirm')}</button>
        </div>
      </div>
    </div>
  );
};

export default HostSetupModal;