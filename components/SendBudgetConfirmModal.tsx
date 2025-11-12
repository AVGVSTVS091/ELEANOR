import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import CloseButton from './CloseButton';

interface SendBudgetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  onConfirm: (action: 'send' | 'save' | 'cancel') => void;
}

const SendBudgetConfirmModal: React.FC<SendBudgetConfirmModalProps> = ({ isOpen, onClose, leadName, onConfirm }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'initial' | 'no_selected'>('initial');

  useEffect(() => {
    if (isOpen) {
      setStep('initial');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  const handleConfirm = (action: 'send' | 'save' | 'cancel') => {
      onConfirm(action);
      onClose();
  }

  const renderInitialStep = () => (
    <>
      <h3 className="text-lg font-medium text-center pr-6">{t('budget.sendTo', { name: leadName })}</h3>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <button onClick={() => handleConfirm('send')} className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700">
          {t('budget.sendConfirm.yes')}
        </button>
        <button onClick={() => setStep('no_selected')} className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700">
          {t('budget.sendConfirm.no')}
        </button>
        <button onClick={() => handleConfirm('save')} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">
          {t('budget.sendConfirm.save')}
        </button>
      </div>
    </>
  );
  
  const renderNoSelectedStep = () => (
      <>
        <h3 className="text-lg font-medium text-center pr-6">{t('budget.sendConfirm.whatToDo')}</h3>
        <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => handleConfirm('save')} className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700">
                {t('budget.sendConfirm.saveBudget')}
            </button>
            <button onClick={() => handleConfirm('cancel')} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">
                {t('budget.sendConfirm.cancel')}
            </button>
        </div>
      </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[52] flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <CloseButton onClose={onClose} className="absolute top-2 right-2" />
        {step === 'initial' ? renderInitialStep() : renderNoSelectedStep()}
      </div>
    </div>
  );
};

export default SendBudgetConfirmModal;