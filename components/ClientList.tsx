import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { MagnifyingGlassIcon, PhoneIcon, WhatsAppIcon, DocumentTextIcon } from './Icons';
import ContextMenu from './ContextMenu';
import { getWhatsAppLink } from '../utils/whatsappUtils';
import ClientListItem from './ClientListItem';
import CallHistoryModal from './CallHistoryModal';

interface ClientListProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  onGenerateBudgetForClient: (clientId: string) => void;
  onOpenChat: (clientId: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, selectedClientId, onSelectClient, updateClient, onGenerateBudgetForClient, onOpenChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; client: Client | null }>({
    isOpen: false,
    x: 0,
    y: 0,
    client: null,
  });
  const [historyModalClient, setHistoryModalClient] = useState<Client | null>(null);
  const { t } = useTranslation();

  const sortedClients = useMemo(() => {
    return clients
      .filter(client =>
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phoneNumber.includes(searchTerm)
      )
      .sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [clients, searchTerm]);

  const handleLongPress = (event: React.TouchEvent | React.MouseEvent, client: Client) => {
    event.preventDefault();
    const x = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const y = 'touches' in event ? event.touches[0].clientY : event.clientY;
    setContextMenu({ isOpen: true, x, y, client });
  };
  
  const closeContextMenu = () => {
      setContextMenu({ isOpen: false, x: 0, y: 0, client: null });
  };
  
  const contextMenuActions = useMemo(() => {
    if (!contextMenu.client) return [];
    const client = contextMenu.client;
    const fullPhone = `${client.countryCode}${client.phoneNumber}`.replace(/\D/g, '');

    return [
      { label: t('contextMenu.call', {phone: client.phoneNumber}), icon: <PhoneIcon className="w-5 h-5"/>, onClick: () => window.location.href = `tel:${fullPhone}` },
      { label: t('contextMenu.whatsapp'), icon: <WhatsAppIcon className="w-5 h-5 text-green-500"/>, onClick: () => window.open(getWhatsAppLink(client.countryCode, client.phoneNumber), '_blank') },
      { label: t('contextMenu.whatsappCall'), icon: <PhoneIcon className="w-5 h-5 text-green-500"/>, onClick: () => window.location.href = `whatsapp://call?number=${fullPhone}` },
      { label: t('contextMenu.generateBudget'), icon: <DocumentTextIcon className="w-5 h-5"/>, onClick: () => onGenerateBudgetForClient(client.id) },
    ]
  }, [contextMenu.client, onGenerateBudgetForClient, t]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
                type="text"
                placeholder={t('sidebar.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white hidden md:block"
            />
            <div className="md:hidden">
              {isSearchVisible ? (
                <input
                  type="text"
                  placeholder={t('sidebar.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onBlur={() => setIsSearchVisible(false)}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
              ) : (
                <div className="flex justify-end items-center h-9">
                  <button 
                    onClick={() => setIsSearchVisible(true)} 
                    className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Search"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            <ul className="overflow-y-auto">
                {sortedClients.map(client => (
                    <ClientListItem
                      key={client.id}
                      client={client}
                      isSelected={selectedClientId === client.id}
                      onSelect={onSelectClient}
                      onLongPress={handleLongPress}
                      updateClient={updateClient}
                      onOpenHistory={() => setHistoryModalClient(client)}
                      onOpenChat={onOpenChat}
                    />
                ))}
            </ul>
        </div>
        <ContextMenu 
            isOpen={contextMenu.isOpen}
            position={{ x: contextMenu.x, y: contextMenu.y }}
            actions={contextMenuActions}
            onClose={closeContextMenu}
        />
        <CallHistoryModal
            client={historyModalClient}
            onClose={() => setHistoryModalClient(null)}
        />
    </div>
  );
};

export default ClientList;