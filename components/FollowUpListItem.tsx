import React, { useState, useRef } from 'react';
import { Client } from '../types';
import Countdown from './Countdown';
import { useTranslation } from '../hooks/useTranslation';
import { TrashIcon, ChatBubbleIcon } from './Icons';

interface FollowUpListItemProps {
  client: Client;
  isSelected: boolean;
  onSelect: (id: string) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  onOpenChat: (clientId: string) => void;
}

const FollowUpListItem: React.FC<FollowUpListItemProps> = ({ client, isSelected, onSelect, updateClient, onOpenChat }) => {
  const { t } = useTranslation();
  const [translateX, setTranslateX] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);
  
  const actionWidth = 80; // Width of the delete button area
  const threshold = actionWidth * 0.5; // Swipe distance to trigger snap

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
    if (itemRef.current) {
        itemRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const currentX = e.touches[0].clientX;
    let diff = currentX - touchStartX.current;
    if (diff > 0) diff = 0; // only allow left swipe
    if (diff < -actionWidth * 1.5) diff = -actionWidth * 1.5; // limit swipe
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    if (itemRef.current) {
        itemRef.current.style.transition = 'transform 0.3s ease-out';
    }
    
    if (translateX < -threshold) {
      setTranslateX(-actionWidth);
    } else {
      setTranslateX(0);
    }
  };

  const handleDelete = () => {
    if (window.confirm(t('followUps.deletePrompt'))) {
      updateClient(client.id, { nextFollowUpDate: null, isPaused: false, pausedTimeLeft: null });
    }
    setTranslateX(0);
  };
  
  const handleChatClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenChat(client.id);
  }


  return (
    <li className="relative bg-white dark:bg-gray-800 overflow-hidden border-b border-gray-200 dark:border-gray-700">
      <div className="absolute top-0 right-0 h-full flex items-center z-0">
        <button 
          onClick={handleDelete} 
          className="bg-red-600 text-white h-full px-6 flex flex-col items-center justify-center"
          style={{ width: `${actionWidth}px`}}
          aria-label={t('followUp.delete')}
        >
            <TrashIcon className="w-5 h-5"/>
            <span className="text-xs mt-1">{t('followUp.delete')}</span>
        </button>
      </div>
      <div
        ref={itemRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onSelect(client.id)}
        style={{ transform: `translateX(${translateX}px)`, touchAction: 'pan-y' }}
        className={`w-full text-left p-4 cursor-pointer relative z-10 bg-white dark:bg-gray-800 ${isSelected ? 'bg-green-50 dark:bg-gray-900 border-l-4 border-green-500' : ''}`}
      >
        <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-base mb-1 truncate ${isSelected ? 'text-green-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-100'}`}>{client.companyName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{client.countryCode} {client.phoneNumber}</p>
            </div>
            <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                <button onClick={handleChatClick} aria-label={`Chat with ${client.companyName}`} className="p-2 rounded-full text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <ChatBubbleIcon className="w-5 h-5"/>
                </button>
                <Countdown
                    client={client}
                    shortFormat={true}
                    updateClient={updateClient}
                />
            </div>
        </div>
      </div>
    </li>
  );
};

export default FollowUpListItem;