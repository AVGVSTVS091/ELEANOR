import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { parsePastedText } from '../utils/textParser';
import { useTranslation } from '../hooks/useTranslation';
import CloseButton from './CloseButton';

type ParsedClientData = Omit<Client, 'id' | 'rating' | 'followUps' | 'quotes' | 'invoices' | 'notes' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft'>;

interface MultiClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType' | 'rating' | 'followUps' | 'quotes' | 'invoices' | 'notes'> & Partial<Pick<Client, 'rating' | 'followUps' | 'quotes' | 'invoices' | 'notes'>>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
}

const MultiClientForm: React.FC<MultiClientFormProps> = ({ isOpen, onClose, clients, addClient, updateClient }) => {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [pastedText, setPastedText] = useState('');
  const [parsedClients, setParsedClients] = useState<ParsedClientData[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const { t } = useTranslation();

  const { duplicates, nonDuplicates } = useMemo(() => {
    if (step !== 'preview') return { duplicates: [], nonDuplicates: [] };
    const existingPhones = new Set(clients.map(c => c.phoneNumber).filter(Boolean));
    const duplicates: ParsedClientData[] = [];
    const nonDuplicates: ParsedClientData[] = [];
    const processedPhones = new Set(); // To handle duplicates within the pasted text itself

    parsedClients.forEach(pc => {
        if (!pc.phoneNumber || processedPhones.has(pc.phoneNumber)) return;
        processedPhones.add(pc.phoneNumber);
        if (existingPhones.has(pc.phoneNumber)) {
            duplicates.push(pc);
        } else {
            nonDuplicates.push(pc);
        }
    });

    return { duplicates, nonDuplicates };
  }, [parsedClients, clients, step]);

  const handlePreview = () => {
    const parsed = parsePastedText(pastedText);
    if (parsed.length === 0) {
      alert(t('alerts.noClientsParsed'));
      return;
    }
    setParsedClients(parsed);
    setStep('preview');
  };
  
  const handleSave = () => {
    nonDuplicates.forEach(clientData => {
      addClient(clientData);
    });

    if (overwrite) {
      duplicates.forEach(clientData => {
        const existingClient = clients.find(c => c.phoneNumber === clientData.phoneNumber);
        if (existingClient) {
          updateClient(existingClient.id, clientData);
        }
      });
    }

    const addedCount = nonDuplicates.length;
    const updatedCount = overwrite ? duplicates.length : 0;
    alert(t('alerts.importSuccess', { added: addedCount, updated: updatedCount }));
    handleClose();
  };
  
  const handleClose = () => {
    setStep('input');
    setPastedText('');
    setParsedClients([]);
    setOverwrite(false);
    onClose();
  }

  if (!isOpen) return null;

  const renderInputStep = () => (
    <>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('multiClientForm.pasteLabel')}
        </p>
        <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={t('multiClientForm.pastePlaceholder')}
            className="w-full h-64 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
        ></textarea>
        <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={handleClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">{t('clientForm.cancel')}</button>
            <button type="button" onClick={handlePreview} disabled={!pastedText.trim()} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:bg-green-300">{t('multiClientForm.preview')}</button>
        </div>
    </>
  );

  const renderPreviewStep = () => (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-green-600 dark:text-green-400">{t('multiClientForm.newClients', { count: nonDuplicates.length })}</h3>
          <div className="mt-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
            {nonDuplicates.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {nonDuplicates.map((c, i) => <li key={i} className="py-1 text-sm">{c.companyName} - {c.phoneNumber}</li>)}
                </ul>
            ) : <p className="text-sm text-gray-600">{t('multiClientForm.noNewClients')}</p>}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-yellow-600 dark:text-yellow-400">{t('multiClientForm.duplicates', { count: duplicates.length })}</h3>
          {duplicates.length > 0 && (
            <div className="mt-2 flex items-center space-x-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <p className="text-sm">{t('multiClientForm.duplicatesQuestion')}</p>
                <div className="flex items-center space-x-4">
                    <label className="flex items-center text-sm"><input type="radio" name="overwrite" checked={!overwrite} onChange={() => setOverwrite(false)} className="mr-1" /> {t('multiClientForm.skip')}</label>
                    <label className="flex items-center text-sm"><input type="radio" name="overwrite" checked={overwrite} onChange={() => setOverwrite(true)} className="mr-1" /> {t('multiClientForm.overwrite')}</label>
                </div>
            </div>
          )}
          <div className="mt-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
            {duplicates.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {duplicates.map((c, i) => <li key={i} className="py-1 text-sm">{c.companyName} - {c.phoneNumber}</li>)}
                </ul>
            ) : <p className="text-sm text-gray-600">{t('multiClientForm.noDuplicates')}</p>}
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-between">
            <button type="button" onClick={() => setStep('input')} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">{t('multiClientForm.back')}</button>
            <button type="button" onClick={handleSave} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">{t('multiClientForm.confirmAndSave')}</button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 m-4 max-w-2xl w-full">
        <CloseButton onClose={handleClose} className="absolute top-4 right-4" />
        <h2 className="text-2xl font-bold mb-2 dark:text-gray-100">{t('multiClientForm.title')}</h2>
        {step === 'input' ? renderInputStep() : renderPreviewStep()}
      </div>
    </div>
  );
};

export default MultiClientForm;