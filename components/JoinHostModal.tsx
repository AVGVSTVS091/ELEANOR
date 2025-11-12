import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useSettings } from '../hooks/useSettings';
import CloseButton from './CloseButton';

interface JoinHostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinHostModal: React.FC<JoinHostModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { joinHostSession } = useSettings();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setError('');
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
        const success = joinHostSession(pin);
        if (success) {
            alert(t('joinHost.success'));
            onClose();
        } else {
            setError(t('joinHost.invalidPin'));
        }
        setIsLoading(false);
    }, 500);
  };
  
  const handleClose = () => {
      setPin('');
      setError('');
      setIsLoading(false);
      onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-[51] flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
        <CloseButton onClose={handleClose} className="absolute top-3 right-3" />
        <h2 className="text-xl font-bold dark:text-gray-100">{t('joinHost.title')}</h2>
        
        <div className="my-4">
            <label htmlFor="pin-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('joinHost.enterCode')}</label>
            <input 
                id="pin-input"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full p-3 text-center text-2xl tracking-[.5em] font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
                placeholder="ABC123"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={handleClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">{t('clientForm.cancel')}</button>
          <button onClick={handleConnect} disabled={isLoading || pin.length < 6} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:bg-green-300">
            {isLoading ? '...': t('joinHost.accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinHostModal;