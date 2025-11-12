import React, { useEffect } from 'react';
import { Client, Budget } from '../types';
import FollowUpSection from './FollowUpSection';
import Rating from './Rating';
import FileUploadSection from './FileUploadSection';
import NotesSection from './NotesSection';
import { EditIcon, TrashIcon, WhatsAppIcon, ChevronLeftIcon, DocumentTextIcon, ShareIcon, EyeIcon } from './Icons';
import { checkWhatsAppAvailability, getWhatsAppLink } from '../utils/whatsappUtils';
import { useTranslation } from '../hooks/useTranslation';
import { generateBudgetPDF } from './BudgetPDF';
import { useSettings } from '../hooks/useSettings';


interface ClientDetailProps {
  client: Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  deleteBudget: (budgetId: string) => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, updateClient, onEdit, onDelete, onBack, deleteBudget }) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  
  useEffect(() => {
    let isMounted = true;
    if (client.whatsAppStatus === 'unknown') {
      updateClient(client.id, { whatsAppStatus: 'checking' });
      checkWhatsAppAvailability(client.countryCode, client.phoneNumber).then(isAvailable => {
        if (isMounted) {
          const newStatus = isAvailable ? 'available' : 'unavailable';
          updateClient(client.id, { whatsAppStatus: newStatus });
        }
      });
    }
    return () => { isMounted = false; };
  }, [client.id, client.countryCode, client.phoneNumber, client.whatsAppStatus, updateClient]);

  const handleRatingChange = (newRating: number) => {
    updateClient(client.id, { rating: newRating });
  };

  const handlePreviewBudget = (budget: Budget) => {
    generateBudgetPDF(budget, client, settings, 'preview');
  };

  const handleShareBudget = (budget: Budget) => {
     generateBudgetPDF(budget, client, settings, 'share');
  }

  const handleDeleteBudget = (budgetId: string) => {
    if (window.confirm(t('alerts.confirmBudgetDelete'))) {
        deleteBudget(budgetId);
    }
  }

  const renderWhatsAppStatus = () => {
    switch (client.whatsAppStatus) {
      case 'available':
        return (
          <a
            href={getWhatsAppLink(client.countryCode, client.phoneNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors"
            >
            <WhatsAppIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{t('clientDetail.sendMessage')}</span>
          </a>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <WhatsAppIcon className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-400"/>
            {t('clientDetail.notOnWhatsApp')}
          </span>
        );
      case 'checking':
        return <span className="text-sm text-gray-500 dark:text-gray-400 italic">{t('clientDetail.checkingWhatsApp')}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 h-full w-full overflow-y-auto">
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 text-gray-500 dark:text-gray-400 rounded-full md:hidden hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{client.companyName}</h2>
              <p className="text-md text-gray-600 dark:text-gray-400 mt-1">{client.industry}</p>
              <div className="flex items-center flex-wrap gap-3 mt-2">
                <p className="text-md text-gray-600 dark:text-gray-400">{client.countryCode} {client.phoneNumber}</p>
                {renderWhatsAppStatus()}
              </div>
            </div>
        </div>
        <div className="flex space-x-2">
            <button onClick={onEdit} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none"><EditIcon className="w-5 h-5" /></button>
            <button onClick={() => onDelete(client.id)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none"><TrashIcon className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <InfoCard title={t('clientDetail.followUpTitle')}>
            <FollowUpSection client={client} updateClient={updateClient} />
          </InfoCard>
          <InfoCard title={t('clientDetail.ratingTitle')}>
             <Rating rating={client.rating} onRatingChange={handleRatingChange} />
          </InfoCard>
           <InfoCard title={t('clientDetail.notesTitle')}>
            <NotesSection client={client} updateClient={updateClient} />
          </InfoCard>
        </div>

        <div className="space-y-6">
          <InfoCard title={t('clientDetail.budgetsTitle')}>
            <div className="space-y-2">
                {client.budgets?.length > 0 ? client.budgets.map(budget => (
                    <div key={budget.id} className="flex items-center p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <DocumentTextIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{`Budget #${budget.id.substring(7, 13)}`}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(budget.date).toLocaleDateString()} - ${budget.total.toFixed(2)}
                             </p>
                        </div>
                         <button onClick={() => handlePreviewBudget(budget)} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" title={t('budgets.view')}><EyeIcon className="w-4 h-4"/></button>
                         <button onClick={() => handleShareBudget(budget)} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-green-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" title={t('budgets.share')}><ShareIcon className="w-4 h-4"/></button>
                         <button onClick={() => handleDeleteBudget(budget.id)} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" title={t('budgets.delete')}><TrashIcon className="w-4 h-4"/></button>
                    </div>
                )) : <p className="text-sm text-gray-500 dark:text-gray-400">{t('budgets.noBudgets')}</p>}
            </div>
          </InfoCard>
           <InfoCard title={t('clientDetail.quotesTitle')}>
            <FileUploadSection
              clientId={client.id}
              files={client.quotes}
              updateClient={updateClient}
              fileType="quotes"
              />
          </InfoCard>
          <InfoCard title={t('clientDetail.invoicesTitle')}>
            <FileUploadSection
              clientId={client.id}
              files={client.invoices}
              updateClient={updateClient}
              fileType="invoices"
            />
          </InfoCard>
        </div>
      </div>
    </div>
  );
};

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children }) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
        {children}
    </div>
)

export default ClientDetail;