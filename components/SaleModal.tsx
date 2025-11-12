import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { DocumentIcon, XMarkIcon } from './Icons';
import StorageSourcePicker from './StorageSourcePicker';
import CloseButton from './CloseButton';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { clientName: string; amount: number; date: string; invoiceRef: string }) => void;
  initialClientName: string;
}

const SaleModal: React.FC<SaleModalProps> = ({ isOpen, onClose, onSave, initialClientName }) => {
  const { t } = useTranslation();
  const [clientName, setClientName] = useState(initialClientName);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceRef, setInvoiceRef] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setClientName(initialClientName);
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setInvoiceRef('');
    }
  }, [isOpen, initialClientName]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;
    onSave({
        clientName,
        amount: parseFloat(amount),
        date,
        invoiceRef
    });
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setInvoiceRef(file.name);
      }
      e.target.value = ''; // Reset
  }

  const handleSourceSelect = (source: 'device' | 'drive' | 'other') => {
      if (source === 'device') {
          fileInputRef.current?.click();
      } else if (source === 'drive') {
          // Simulate Drive picker delay
          setTimeout(() => {
              setInvoiceRef("Drive_Document.pdf"); // Mocked selection
          }, 500);
      } else if (source === 'other') {
          // Fallback to generic file picker which usually includes other apps
          fileInputRef.current?.click();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold dark:text-gray-100">{t('sale.title')}</h3>
            <CloseButton onClose={onClose} />
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sale.clientName')}</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sale.amount')}</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sale.date')}</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Factura / Presupuesto (opcional)</label>
                {invoiceRef ? (
                    <div className="flex items-center justify-between p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <DocumentIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <span className="text-sm truncate dark:text-gray-200">{invoiceRef}</span>
                        </div>
                        <button type="button" onClick={() => setInvoiceRef('')} className="p-1 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button 
                        type="button" 
                        onClick={() => setIsPickerOpen(true)}
                        className="w-full p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm"
                    >
                        Seleccionar archivo...
                    </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium">{t('sale.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium">{t('sale.save')}</button>
            </div>
        </form>
      </div>
      
      <StorageSourcePicker 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectSource={handleSourceSelect}
        mode="import"
      />
    </div>
  );
};

export default SaleModal;