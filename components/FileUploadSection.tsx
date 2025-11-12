import React, { useState } from 'react';
import { Client, FileRecord } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { analyzeImageWithGemini } from '../services/geminiService';
import { UploadIcon, DocumentIcon, TrashIcon, SparklesIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';


interface FileUploadSectionProps {
  clientId: string;
  files: FileRecord[];
  updateClient: (id: string, data: Partial<Client>) => void;
  fileType: 'quotes' | 'invoices';
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ clientId, files, updateClient, fileType }) => {
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64Content = await fileToBase64(file);
      const newFile: FileRecord = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: base64Content,
        description: description,
        uploadDate: new Date().toISOString(),
      };
      const updatedFiles = [...files, newFile];
      updateClient(clientId, { [fileType]: updatedFiles });
      setDescription('');
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error processing file:', error);
      alert(t('alerts.fileUploadFailed'));
    }
  };

  const handleDelete = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    updateClient(clientId, { [fileType]: updatedFiles });
  };

  const handleAnalyzeImage = async (file: FileRecord) => {
    if (!file.type.startsWith('image/')) {
        alert(t('alerts.onlyImagesAnalyzed'));
        return;
    }
    setIsAnalyzing(file.id);
    try {
        const analysis = await analyzeImageWithGemini(file.content, file.type);
        const updatedDescription = `${t('alerts.geminiAnalysisPrefix')} ${analysis}\n\n${file.description}`;
        const updatedFiles = files.map(f => f.id === file.id ? {...f, description: updatedDescription} : f);
        updateClient(clientId, { [fileType]: updatedFiles });
    } catch (error) {
        alert(t('alerts.imageAnalysisFailed'));
    } finally {
        setIsAnalyzing(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <label htmlFor={`${fileType}-upload`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('fileUpload.uploadNew')}
        </label>
        <input
            id={`${fileType}-description`}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('fileUpload.descriptionPlaceholder')}
            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md px-6 py-4 flex justify-center items-center hover:border-green-500 dark:hover:border-indigo-500">
            <div className="text-center">
                <UploadIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                <label htmlFor={`${fileType}-file-input`} className="relative cursor-pointer bg-transparent rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                    <span>{t('fileUpload.selectFile')}</span>
                    <input id={`${fileType}-file-input`} name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('fileUpload.fileTypes')}</p>
            </div>
        </div>
      </div>
      <div className="space-y-2">
        {files.map(file => (
          <div key={file.id} className="flex items-start p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
            <DocumentIcon className="w-6 h-6 text-green-600 dark:text-gray-500 mt-1 flex-shrink-0" />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{file.description}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {new Date(file.uploadDate).toLocaleDateString()}
              </p>
            </div>
            {file.type.startsWith('image/') && (
                <button 
                    onClick={() => handleAnalyzeImage(file)} 
                    className="p-1 text-gray-500 dark:text-gray-500 hover:text-blue-500 disabled:opacity-50"
                    disabled={isAnalyzing === file.id}
                    title={t('fileUpload.analyzeWithGemini')}
                >
                   {isAnalyzing === file.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div> : <SparklesIcon className="w-4 h-4"/>}
                </button>
            )}
            <button onClick={() => handleDelete(file.id)} className="p-1 text-gray-500 dark:text-gray-500 hover:text-red-500" title={t('fileUpload.deleteFile')}>
                <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploadSection;