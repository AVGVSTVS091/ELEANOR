import React, { useMemo } from 'react';
import { Client } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import FollowUpListItem from './FollowUpListItem';

interface FollowUpPageProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  onOpenChat: (clientId: string) => void;
}

const FollowUpPage: React.FC<FollowUpPageProps> = ({ clients, selectedClientId, onSelectClient, updateClient, onOpenChat }) => {
  const { t } = useTranslation();

  const sortedClients = useMemo(() => {
    return clients
      .filter(c => c.nextFollowUpDate)
      .sort((a, b) => new Date(a.nextFollowUpDate!).getTime() - new Date(b.nextFollowUpDate!).getTime());
  }, [clients]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('followUps.title')}</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="overflow-y-auto">
          {sortedClients.map(client => (
            <FollowUpListItem
              key={client.id}
              client={client}
              isSelected={selectedClientId === client.id}
              onSelect={onSelectClient}
              updateClient={updateClient}
              onOpenChat={onOpenChat}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FollowUpPage;