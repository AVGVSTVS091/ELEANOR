import React, { useState } from 'react';
import { Client, FollowUp } from '../types';
import { addBusinessDays } from '../utils/dateUtils';
import { PhoneIcon, PauseIcon, PlayIcon, TrashIcon, CalendarIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import PostponeModal from './PostponeModal';
import Countdown from './Countdown';

interface FollowUpSectionProps {
  client: Client;
  updateClient: (id: string, data: Partial<Client>) => void;
}

const FollowUpSection: React.FC<FollowUpSectionProps> = ({ client, updateClient }) => {
  const { t } = useTranslation();
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const lastFollowUp = client.followUps.length > 0
    ? new Date(client.followUps[client.followUps.length - 1].timestamp)
    : null;

  const handleRegisterCall = () => {
    const newFollowUp: FollowUp = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    const updatedFollowUps = [...client.followUps, newFollowUp];
    const newNextFollowUpDate = addBusinessDays(new Date(), 7).toISOString();
    
    updateClient(client.id, { 
      followUps: updatedFollowUps,
      nextFollowUpDate: newNextFollowUpDate,
      isPaused: false,
      pausedTimeLeft: null,
      status: 'active', // Move back to active list
    });
  };

  const handleReschedule = (newDate: string | null) => {
    const nextDate = newDate ? newDate : addBusinessDays(new Date(), 7).toISOString();
    updateClient(client.id, { 
        nextFollowUpDate: nextDate,
        isPaused: false,
        pausedTimeLeft: null,
    });
    setIsRescheduleOpen(false);
  };

  const handlePause = () => {
    if (!client.nextFollowUpDate) return;
    const timeLeft = new Date(client.nextFollowUpDate).getTime() - Date.now();
    updateClient(client.id, { isPaused: true, pausedTimeLeft: timeLeft > 0 ? timeLeft : 0 });
  };

  const handleResume = () => {
    if (!client.pausedTimeLeft) return;
    const newTargetDate = new Date(Date.now() + client.pausedTimeLeft);
    updateClient(client.id, { isPaused: false, pausedTimeLeft: null, nextFollowUpDate: newTargetDate.toISOString() });
  };

  const handleDelete = () => {
    if (window.confirm(t('alerts.confirmFollowUpDelete'))) {
        const updatedFollowUps = client.followUps.slice(0, -1);
        updateClient(client.id, { 
            followUps: updatedFollowUps,
            nextFollowUpDate: null, 
            isPaused: false, 
            pausedTimeLeft: null 
        });
    }
  };
  
  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-400">{t('followUp.nextFollowUp')}</p>
        <Countdown client={client} shortFormat={false} updateClient={updateClient} />
        {lastFollowUp && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last call: {lastFollowUp.toLocaleString()}</p>}
      </div>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={handleRegisterCall}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <PhoneIcon className="w-5 h-5 mr-2" />
          {t('followUp.registerCall')}
        </button>
        {client.nextFollowUpDate && (
            <div className="grid grid-cols-3 gap-2">
                 <button
                    onClick={() => setIsRescheduleOpen(true)}
                    className="inline-flex items-center justify-center px-2 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
                    title={t('followUp.reschedule')}
                >
                    <CalendarIcon className="w-5 h-5"/>
                </button>
                {client.isPaused ? (
                    <button
                        onClick={handleResume}
                        className="inline-flex items-center justify-center px-2 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600"
                        title={t('followUp.resume')}
                    >
                        <PlayIcon className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handlePause}
                        className="inline-flex items-center justify-center px-2 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600"
                        title={t('followUp.pause')}
                    >
                        <PauseIcon className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={handleDelete}
                    className="inline-flex items-center justify-center px-2 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                    title={t('followUp.delete')}
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>
      <PostponeModal 
        isOpen={isRescheduleOpen} 
        onClose={() => setIsRescheduleOpen(false)} 
        onSave={handleReschedule}
        title={t('rescheduleModal.title')}
       />
    </div>
  );
};

export default FollowUpSection;