import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import PriceLists from './PriceLists';
import NewBudget from './NewBudget';
import { Client, Budget, Lead } from '../types';
import { XMarkIcon } from './Icons';

interface BudgetsPageProps {
  clients: Client[];
  onSaveBudget: (clientId: string, budgetData: Omit<Budget, 'id'>) => void;
  onSaveBudgetForLead: (budgetData: Omit<Budget, 'id'>, lead: Lead) => void;
  addClient: (clientData: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType'>) => Client;
  initialBudgetInfo?: {clientId?: string, tab: 'new', leadName?: string} | null;
  isForChat?: boolean;
  onOnChatClose?: () => void;
  onShareBudgetInChat?: (budgetData: Omit<Budget, 'id'>) => void;
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({ clients, onSaveBudget, onSaveBudgetForLead, addClient, initialBudgetInfo, isForChat, onOnChatClose, onShareBudgetInChat }) => {
  const [activeTab, setActiveTab] = useState<'lists' | 'new'>(initialBudgetInfo?.tab || (isForChat ? 'new' : 'lists'));
  const { t } = useTranslation();

  const tabs = [
    { id: 'lists', label: t('budgets.lists') },
    { id: 'new', label: t('budgets.new') },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900">
        {isForChat && (
            <header className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h2 className="text-lg font-semibold ml-2">{t('budget.generatorTitle')}</h2>
                <button onClick={onOnChatClose} className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </header>
        )}
      <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6">
        {!isForChat && (
            <nav className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6 self-center md:self-start">
                {tabs.map(tab => (
                     <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as 'lists' | 'new')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md focus:outline-none transition-colors ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-indigo-400 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                        {tab.label}
                     </button>
                ))}
             </nav>
        )}
        {activeTab === 'lists' && <PriceLists />}
        {activeTab === 'new' && <NewBudget clients={clients} onSaveBudget={onSaveBudget} onSaveBudgetForLead={onSaveBudgetForLead} addClient={addClient} initialBudgetInfo={initialBudgetInfo} onShareBudgetInChat={onShareBudgetInChat} />}
      </main>
    </div>
  );
};

export default BudgetsPage;