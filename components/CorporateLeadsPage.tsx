
import React, { useState, useMemo } from 'react';
import { Lead, Client } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { ChatBubbleLeftEllipsisIcon, ChevronRightIcon, TrashIcon, XMarkIcon } from './Icons';
import { useLongPress } from '../hooks/useLongPress';

interface CorporateLeadsPageProps {
  leads: (Lead | Client)[];
  onSelectLead: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onDeleteMultipleChats: (ids: string[]) => void;
}

const CorporateLeadsPage: React.FC<CorporateLeadsPageProps> = ({ leads, onSelectLead, onDeleteChat, onDeleteMultipleChats }) => {
  const { t } = useTranslation();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; ids: string[] }>({ isOpen: false, ids: [] });
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter clients/leads that have chat activity or are new leads
  const chatList = useMemo(() => {
      return leads.filter(item => {
          if ('lastMessage' in item) return true; // It's a Lead
          return item.chatStatus && item.chatStatus !== 'archivado'; // It's a Client with active chat
      }).sort((a, b) => {
          const timeA = 'timestamp' in a ? a.timestamp : (a.notes?.[0]?.lastUpdated || new Date().toISOString());
          const timeB = 'timestamp' in b ? b.timestamp : (b.notes?.[0]?.lastUpdated || new Date().toISOString());
          return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
  }, [leads]);

  const filteredChatList = useMemo(() => {
      if (filterStatus === 'all') return chatList;
      
      if (filterStatus === 'noReply') {
          return chatList.filter(item => ('unreadCount' in item ? item.unreadCount > 0 : false));
      }

      if (filterStatus === 'Ninguno') {
          return chatList.filter(item => item.conversationStatus === 'Ninguno' || !item.conversationStatus);
      }

      return chatList.filter(item => item.conversationStatus === filterStatus);
  }, [chatList, filterStatus]);

  const handleToggleSelection = (id: string) => {
    setSelectedChatIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleLongPress = (id: string) => {
      if (!selectionMode) {
          setSelectionMode(true);
          setSelectedChatIds(new Set([id]));
      } else {
          handleToggleSelection(id);
      }
  };

  const handleItemClick = (id: string) => {
      if (selectionMode) {
          handleToggleSelection(id);
      } else {
          onSelectLead(id);
      }
  };

  const exitSelectionMode = () => {
      setSelectionMode(false);
      setSelectedChatIds(new Set());
  };

  const confirmDelete = () => {
      if (deleteConfirm.ids.length === 1) {
          onDeleteChat(deleteConfirm.ids[0]);
      } else {
          onDeleteMultipleChats(deleteConfirm.ids);
      }
      setDeleteConfirm({ isOpen: false, ids: [] });
      exitSelectionMode();
  };

  if (chatList.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <ChatBubbleLeftEllipsisIcon className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-semibold">{t('corporate.noLeads')}</h2>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full relative">
      {!selectionMode && (
          <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
              <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label={t('chat.status.label')}
              >
                  <option value="all">{t('chat.status.all')}</option>
                  <option value="Ninguno">{t('chat.status.none')}</option>
                  <option value="En seguimiento">{t('chat.status.tracking')}</option>
                  <option value="Fidelizado">{t('chat.status.loyal')}</option>
                  <option value="Sin contacto">{t('chat.status.noContact')}</option>
                  <option value="Perdido">{t('chat.status.lost')}</option>
                  <option value="noReply">{t('chat.status.noReply')}</option>
              </select>
          </div>
      )}

      {selectionMode ? (
        <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={exitSelectionMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="font-semibold text-lg dark:text-white">{selectedChatIds.size} {t('tasks.selected')}</span>
            </div>
            {selectedChatIds.size > 0 && (
                <button onClick={() => setDeleteConfirm({ isOpen: true, ids: Array.from(selectedChatIds) })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full">
                    <TrashIcon className="w-6 h-6" />
                </button>
            )}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredChatList.map(item => {
            const isSelected = selectedChatIds.has(item.id);
            const name = 'name' in item ? item.name : item.companyName;
            const lastMessage = 'lastMessage' in item ? item.lastMessage : t('chat.status.tracking');
            const timestamp = 'timestamp' in item ? item.timestamp : (item.notes?.[0]?.lastUpdated || new Date().toISOString());
            const unreadCount = 'unreadCount' in item ? item.unreadCount : 0;

            return (
                <ChatListItem 
                    key={item.id}
                    id={item.id}
                    name={name}
                    lastMessage={lastMessage}
                    timestamp={timestamp}
                    unreadCount={unreadCount}
                    isSelected={isSelected}
                    selectionMode={selectionMode}
                    onClick={handleItemClick}
                    onLongPress={handleLongPress}
                    onDelete={() => setDeleteConfirm({ isOpen: true, ids: [item.id] })}
                />
            );
          })}
        </ul>
      </div>

      {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {deleteConfirm.ids.length > 1 ? t('chat.delete.bulk', { count: deleteConfirm.ids.length }) : t('chat.delete.single')}
                  </h3>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setDeleteConfirm({ isOpen: false, ids: [] })} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium">
                          {t('chat.delete.cancel')}
                      </button>
                      <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md font-medium">
                          {t('chat.delete.confirm')}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const ChatListItem: React.FC<{
    id: string;
    name: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    isSelected: boolean;
    selectionMode: boolean;
    onClick: (id: string) => void;
    onLongPress: (id: string) => void;
    onDelete: () => void;
}> = ({ id, name, lastMessage, timestamp, unreadCount, isSelected, selectionMode, onClick, onLongPress, onDelete }) => {
    const { t } = useTranslation();
    const longPressProps = useLongPress(
        () => onLongPress(id),
        () => onClick(id),
        { delay: 500 }
    );

    return (
        <li
            {...longPressProps}
            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${isSelected ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectionMode && (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-green-600 dark:text-indigo-400 truncate">{name}</p>
                            {unreadCount > 0 && (
                                <span className="flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium text-white bg-red-500 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{lastMessage}</p>
                    </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(timestamp).toLocaleDateString()}
                    </p>
                    {!selectionMode ? (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label={t('chat.delete.action')}
                            title={t('chat.delete.action')}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>
        </li>
    );
}

export default CorporateLeadsPage;
