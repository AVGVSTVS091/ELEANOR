import React, { useState, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { DevicePhoneMobileIcon, CloudIcon, Squares2X2Icon } from './Icons';
import CloseButton from './CloseButton';

interface StorageSourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSource: (source: 'device' | 'drive' | 'other') => void;
  mode: 'import' | 'export';
}

const StorageSourcePicker: React.FC<StorageSourcePickerProps> = ({ isOpen, onClose, onSelectSource, mode }) => {
  const { t } = useTranslation();
  const [showApps, setShowApps] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOther = () => {
      setShowApps(true);
  };

  const handleAppSelect = (appName: string) => {
      // Since we can't really launch specific apps for import in web without intents,
      // we simulate the selection leading to the generic picker or share sheet.
      // For export, we'll try to use share API. For import, standard file input.
      onSelectSource('other');
      onClose();
  };

  // Mock list of "detected" apps
  const cloudApps = [
      { name: 'Dropbox', color: 'bg-blue-500' },
      { name: 'OneDrive', color: 'bg-blue-600' },
      { name: 'Box', color: 'bg-blue-400' },
      { name: 'iCloud', color: 'bg-blue-300' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end md:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-t-xl md:rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-gray-100">
              {showApps ? t('storagePicker.other.title') : t(`storagePicker.title.${mode}`)}
          </h2>
          <CloseButton onClose={onClose} />
        </div>
        
        <div className="p-6">
            {message ? (
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm font-medium">{t('clientForm.cancel')}</button>
                </div>
            ) : showApps ? (
                <div className="grid grid-cols-4 gap-4">
                    {cloudApps.map(app => (
                        <button key={app.name} onClick={() => handleAppSelect(app.name)} className="flex flex-col items-center gap-2 group">
                            <div className={`w-12 h-12 rounded-xl ${app.color} text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                                <span className="font-bold text-xs">{app.name[0]}</span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">{app.name}</span>
                        </button>
                    ))}
                    {cloudApps.length === 0 && (
                        <p className="col-span-4 text-center text-sm text-gray-500">{t('storagePicker.other.noApps')}</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    <button onClick={() => { onSelectSource('device'); onClose(); }} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <DevicePhoneMobileIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">{t('storagePicker.option.device')}</span>
                    </button>
                    
                    <button onClick={() => { onSelectSource('drive'); onClose(); }} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <CloudIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">{t('storagePicker.option.drive')}</span>
                    </button>

                    <button onClick={handleOther} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
                            <Squares2X2Icon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">{t('storagePicker.option.other')}</span>
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StorageSourcePicker;