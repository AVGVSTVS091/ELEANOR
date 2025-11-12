import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { UploadIcon, CloudUploadIcon, CameraIcon } from './Icons';
import CloseButton from './CloseButton';

interface SourceChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevice: () => void;
  onDrive: () => void;
  onCamera: () => void;
  showCameraOption?: boolean;
}

const SourceChooserModal: React.FC<SourceChooserModalProps> = ({ isOpen, onClose, onDevice, onDrive, onCamera, showCameraOption }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[51] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="source-chooser-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="source-chooser-title" className="text-lg font-semibold">Importar desde:</h2>
          <CloseButton onClose={onClose} />
        </div>
        <div className={`p-4 grid gap-4 ${showCameraOption ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button onClick={onDevice} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <UploadIcon className="w-8 h-8 text-sky-500 mb-2" />
            <span className="text-sm font-medium">Mi dispositivo</span>
          </button>
          <button onClick={onDrive} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <CloudUploadIcon className="w-8 h-8 text-sky-500 mb-2" />
            <span className="text-sm font-medium">Desde Drive</span>
          </button>
          {showCameraOption && (
             <button onClick={onCamera} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <CameraIcon className="w-8 h-8 text-sky-500 mb-2" />
                <span className="text-sm font-medium">Cámara</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceChooserModal;