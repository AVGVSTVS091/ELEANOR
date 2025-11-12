import React from 'react';
import { Client } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ClientTypeSelectorProps {
  client: Client;
  updateClient: (id: string, data: Partial<Client>) => void;
}

const ClientTypeSelector: React.FC<ClientTypeSelectorProps> = ({ client, updateClient }) => {
  const { t } = useTranslation();
  const types: NonNullable<Client['clientType']>[] = ['Dist', 'Emp', 'CF', 'Cos', 'Otro'];

  const typeColors: Record<NonNullable<Client['clientType']>, string> = {
    'Dist': 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200',
    'Emp': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
    'CF': 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
    'Cos': 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    'Otro': 'bg-teal-200 text-teal-800 dark:bg-teal-800 dark:text-teal-200',
  };
  const defaultColor = 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    updateClient(client.id, { clientType: value === 'none' ? null : value as Client['clientType'] });
  };
  
  return (
    <select
      value={client.clientType || 'none'}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      className={`text-xs font-bold rounded-full px-2 py-0.5 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 ${client.clientType ? typeColors[client.clientType] : defaultColor}`}
      aria-label={t('clientTypes.title')}
    >
      <option value="none">{t('clientTypes.none')}</option>
      {types.map(type => (
          type && <option key={type} value={type}>{type}</option>
      ))}
    </select>
  );
};

export default ClientTypeSelector;