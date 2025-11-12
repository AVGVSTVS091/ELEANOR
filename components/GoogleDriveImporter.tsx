import React from 'react';
import * as XLSX from 'xlsx';
import { Client } from '../types';
import { CloudUploadIcon } from './Icons';
import { parseTextFile } from '../utils/textParser';
import { useTranslation } from '../hooks/useTranslation';

interface GoogleDriveImporterProps {
  onImport: (clients: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate'>[]) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const GoogleDriveImporter: React.FC<GoogleDriveImporterProps> = ({ onImport, inputRef }) => {
    const { t } = useTranslation();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        const isText = file.name.endsWith('.txt') || file.name.endsWith('.csv');

        reader.onload = (e) => {
            const data = e.target?.result;
            if (!data) return;

            let clients: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate'>[] = [];

            try {
                if(isExcel) {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    clients = json.map((row: any) => ({
                        companyName: row['Nombre de la empresa'] || row['Company Name'] || '',
                        countryCode: '+54',
                        phoneNumber: String(row['Número de teléfono'] || row['Phone Number'] || ''),
                        industry: row['Rubro o actividad'] || row['Industry'] || '',
                        rating: 0,
                        followUps: [],
                        quotes: [],
                        invoices: [],
                        notes: [],
                        isPaused: false,
                        pausedTimeLeft: null,
                        status: 'active',
                    })).filter(c => c.companyName || c.phoneNumber);
                } else if (isText) {
                    const parsedData = parseTextFile(data as string);
                    clients = parsedData.map(c => ({
                        ...c,
                        rating: 0,
                        followUps: [],
                        quotes: [],
                        invoices: [],
                        notes: [],
                        isPaused: false,
                        pausedTimeLeft: null,
                    }));
                }

                if (clients.length > 0) {
                    onImport(clients);
                } else {
                    alert(t('alerts.noClientsInFile'));
                }
            } catch (error) {
                console.error("Error parsing file:", error);
                alert(t('alerts.fileParseError'));
            }
        };

        reader.onerror = () => {
             alert(t('alerts.fileReadFailed'));
        }

        if (isExcel) {
            reader.readAsBinaryString(file);
        } else if (isText) {
            reader.readAsText(file);
        } else {
            alert(t('alerts.unsupportedFileType'));
        }

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
                accept=".xlsx, .xls, .csv, .txt"
                onChange={handleFileChange}
                ref={inputRef}
                style={{ display: 'none' }}
                />
            <button
                onClick={handleClick}
                title="Import from a file downloaded from Google Drive"
                className="w-full inline-flex items-center justify-center p-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                <CloudUploadIcon className="w-5 h-5 mr-2" />
                {t('sidebar.fromDrive')}
            </button>
        </>
    );
};