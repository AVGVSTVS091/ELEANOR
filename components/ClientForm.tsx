import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { CountryCodeSelector } from './CountryCodeSelector';
import CloseButton from './CloseButton';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets'> | Client) => void;
  client: Client | null;
}

const ClientForm: React.FC<ClientFormProps> = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    countryCode: '+54 9',
    phoneNumber: '',
    industry: '',
  });
  const { t } = useTranslation();

  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.companyName || '',
        countryCode: client.countryCode || '+54 9',
        phoneNumber: client.phoneNumber || '',
        industry: client.industry || '',
      });
    } else {
      setFormData({ companyName: '', countryCode: '+54 9', phoneNumber: '', industry: '' });
    }
  }, [client, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCountryCodeChange = (code: string) => {
    setFormData(prev => ({...prev, countryCode: code}));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client && 'id' in client) {
      const hasPhoneNumberChanged = formData.phoneNumber !== client.phoneNumber || formData.countryCode !== client.countryCode;
      onSave({
        ...client,
        ...formData,
        // Reset status if number changes, so it gets re-verified
        ...(hasPhoneNumberChanged && { whatsAppStatus: 'unknown' as const })
      });
    } else {
      onSave(formData as Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets'>);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 m-4 max-w-lg w-full">
        <CloseButton onClose={onClose} className="absolute top-4 right-4" />
        <h2 className="text-2xl font-bold mb-6 dark:text-gray-100">{client ? t('clientForm.editTitle') : t('clientForm.addTitle')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clientForm.companyName')}</label>
              <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clientForm.phoneNumber')}</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <CountryCodeSelector value={formData.countryCode} onChange={handleCountryCodeChange} />
                <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="block w-full flex-1 rounded-none rounded-r-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
            </div>
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clientForm.industry')}</label>
              <input type="text" name="industry" id="industry" value={formData.industry} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">{t('clientForm.cancel')}</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">{t('clientForm.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;