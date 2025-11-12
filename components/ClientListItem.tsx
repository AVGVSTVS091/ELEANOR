
import React from 'react';
import { Client } from '../types';
import { useLongPress } from '../hooks/useLongPress';
import ClientTypeSelector from './ClientTypeSelector';
import { ListBulletIcon, PhoneIcon, WhatsAppIcon, ChatBubbleIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { getWhatsAppLink } from '../utils/whatsappUtils';

interface ClientListItemProps {
  client: Client;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onLongPress: (event: React.TouchEvent | React.MouseEvent, client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  onOpenHistory: (client: Client) => void;
  onOpenChat: (clientId: string) => void;
}

const ClientListItem: React.FC<ClientListItemProps> = ({ client, isSelected, onSelect, onLongPress, updateClient, onOpenHistory, onOpenChat }) => {
  const { t } = useTranslation();
  const longPressProps = useLongPress(
    (e) => onLongPress(e, client),
    () => onSelect(client.id)
  );
  
  const lastCall = client.followUps.length > 0 ? new Date(client.followUps[client.followUps.length - 1].timestamp) : null;
  const hasBeenCalled = client.followUps.length > 0;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getWhatsAppLink(client.countryCode, client.phoneNumber), '_blank');
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullPhone = `${client.countryCode}${client.phoneNumber}`.replace(/\D/g, '');
    window.location.href = `tel:${fullPhone}`;
  };

  const handleChatClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Forces navigation to chat list (CorporateLeadsPage) where this client will be listed
      onOpenChat(client.id);
  }

  return (
    <li
      {...longPressProps}
      className={`w-full text-left p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none cursor-pointer ${isSelected ? 'bg-green-50 dark:bg-gray-900 border-l-4 border-green-500' : ''}`}
    >
      <div className="flex justify-between items-center gap-2">
        {/* Left side: Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenHistory(client); }} 
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-indigo-400 rounded-full flex-shrink-0"
              aria-label={t('callHistory.title')}
            >
                <ListBulletIcon className="w-5 h-5"/>
            </button>
            <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-base truncate ${isSelected ? 'text-green-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-100'}`}>{client.companyName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{client.countryCode} {client.phoneNumber}</p>
            </div>
        </div>

        {/* Right side: Actions or Status */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isSelected ? (
              <>
                <div title={hasBeenCalled ? t('client.status.called') : t('client.status.neverCalled')} className={`w-2.5 h-2.5 rounded-full ${hasBeenCalled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <button onClick={handleChatClick} aria-label={`Chat with ${client.companyName}`} className="p-2 rounded-full text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <ChatBubbleIcon className="w-5 h-5"/>
                </button>
                <button onClick={handleWhatsAppClick} aria-label={`WhatsApp ${client.companyName}`} className="p-2 rounded-full text-green-600 bg-green-100 dark:bg-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700 transition-colors">
                    <WhatsAppIcon className="w-5 h-5"/>
                </button>
                <button onClick={handleCallClick} aria-label={`Call ${client.companyName}`} className="p-2 rounded-full text-blue-600 bg-blue-100 dark:bg-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors">
                    <PhoneIcon className="w-5 h-5"/>
                </button>
              </>
          ) : (
            <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center gap-2">
                    {lastCall && <p className="text-xs text-gray-500 dark:text-gray-400">{lastCall.toLocaleDateString()}</p>}
                    <div title={hasBeenCalled ? t('client.status.called') : t('client.status.neverCalled')} className={`w-2.5 h-2.5 rounded-full ${hasBeenCalled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <ClientTypeSelector client={client} updateClient={updateClient} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default ClientListItem;
