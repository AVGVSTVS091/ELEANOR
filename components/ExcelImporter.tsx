import React from 'react';
import * as XLSX from 'xlsx';
import { Client } from '../types';
import { UploadIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface ExcelImporterProps {
  onImport: (clients: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate'>[]) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ onImport, inputRef }) => {
    const { t } = useTranslation();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const clients: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate'>[] = json.map((row: any) => ({
            companyName: row['Nombre de la empresa'] || row['Company Name'] || '',
            phoneNumber: String(row['Número de teléfono'] || row['Phone Number'] || ''),
            industry: row['Rubro o actividad'] || row['Industry'] || '',
        })).filter(c => c.companyName && c.phoneNumber);

        onImport(clients);
        };
        reader.readAsBinaryString(file);

        // Reset file input to allow re-uploading the same file
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };
    
    const handleClick = () => {
        inputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                ref={inputRef}
                style={{ display: 'none' }}
                />
            <button
                onClick={handleClick}
                title="Import from Excel"
                className="w-full inline-flex items-center justify-center p-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                <UploadIcon className="w-5 h-5 mr-2" />
                {t('sidebar.fromExcel')}
            </button>
        </>
    );
};