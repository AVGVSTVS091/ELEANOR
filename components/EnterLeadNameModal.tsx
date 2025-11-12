import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import CloseButton from './CloseButton';

interface EnterLeadNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  leadPhoneNumber: string;
}

const EnterLeadNameModal: React.FC<EnterLeadNameModalProps> = ({ isOpen, onClose, onSave, leadPhoneNumber }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[52] flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <CloseButton onClose={onClose} className="absolute top-2 right-2" />
        <h3 className="text-lg font-medium mb-2 pr-8">{t('lead.enterNameTitle')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('lead.enterNameBody', { phone: leadPhoneNumber })}</p>
        <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('clientForm.companyName')}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            autoFocus
        />
        <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">{t('clientForm.cancel')}</button>
            <button onClick={handleSave} disabled={!name.trim()} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300">{t('clientForm.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default EnterLeadNameModal;