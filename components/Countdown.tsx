import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Client } from '../types';
import { PauseIcon, PlayIcon, CalendarIcon, TrashIcon } from './Icons';
import PostponeModal from './PostponeModal';
import { addBusinessDays } from '../utils/dateUtils';

interface CountdownProps {
  client: Client;
  shortFormat: boolean;
  updateClient: (id: string, data: Partial<Client>) => void;
}

const Countdown: React.FC<CountdownProps> = ({ client, shortFormat, updateClient }) => {
  const { t } = useTranslation();
  const { id, nextFollowUpDate, isPaused, pausedTimeLeft } = client;
  const [timeLeft, setTimeLeft] = useState('');
  const [isDue, setIsDue] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);


  const formatTime = (ms: number, short: boolean) => {
    if (ms <= 0) return t('followUp.due');

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (!short && seconds > 0 && days === 0) parts.push(`${seconds}s`);
    
    return parts.join(' ') || (short ? '0m' : '0s');
  };
  
  const handlePause = () => {
    if (!nextFollowUpDate) return;
    const timeLeft = new Date(nextFollowUpDate).getTime() - Date.now();
    updateClient(id, { isPaused: true, pausedTimeLeft: timeLeft > 0 ? timeLeft : 0 });
  };

  const handleResume = () => {
    if (!pausedTimeLeft) return;
    const newTargetDate = new Date(Date.now() + pausedTimeLeft);
    updateClient(id, { isPaused: false, pausedTimeLeft: null, nextFollowUpDate: newTargetDate.toISOString() });
  };

  const handleDelete = () => {
    if (window.confirm(t('alerts.confirmFollowUpDelete'))) {
        updateClient(id, { nextFollowUpDate: null, isPaused: false, pausedTimeLeft: null });
    }
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

  useEffect(() => {
    if (isPaused) {
      const pausedString = shortFormat
        ? t('countdown.paused')
        : `${t('countdown.paused')}: ${formatTime(pausedTimeLeft ?? 0, shortFormat)}`;
      setTimeLeft(pausedString);
      setIsDue(false);
      return;
    }

    if (!nextFollowUpDate) {
      setTimeLeft(t('followUp.noFollowUp'));
      setIsDue(false);
      return;
    }

    const targetDate = new Date(nextFollowUpDate);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft(t('followUp.due'));
        setIsDue(true);
        clearInterval(interval);
        return;
      }

      setIsDue(false);
      setTimeLeft(formatTime(difference, shortFormat));
    }, 1000);

    return () => clearInterval(interval);
  }, [nextFollowUpDate, isPaused, pausedTimeLeft, shortFormat, t]);

   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setControlsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const textColor = isDue ? 'text-red-500' : 'text-gray-800 dark:text-gray-100';
  const textSize = shortFormat ? 'text-xs' : 'text-2xl font-bold';

  if (!nextFollowUpDate && shortFormat) return null;

  return (
    <div className="relative" ref={wrapperRef}>
        <button onClick={() => setControlsVisible(!controlsVisible)} className={`text-left ${!shortFormat ? 'w-full' : ''}`}>
            <p className={`${textSize} ${textColor}`}>
                {timeLeft}
            </p>
        </button>
        {controlsVisible && shortFormat && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-1 flex items-center gap-1">
                {isPaused ? (
                    <button onClick={handleResume} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title={t('followUp.resume')}><PlayIcon className="w-4 h-4 text-blue-500"/></button>
                ) : (
                    <button onClick={handlePause} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title={t('followUp.pause')}><PauseIcon className="w-4 h-4 text-yellow-500"/></button>
                )}
                <button onClick={() => setIsRescheduleOpen(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title={t('followUp.reschedule')}><CalendarIcon className="w-4 h-4 text-gray-700 dark:text-gray-300"/></button>
                <button onClick={handleDelete} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title={t('followUp.delete')}><TrashIcon className="w-4 h-4 text-red-500"/></button>
            </div>
        )}
        <PostponeModal 
            isOpen={isRescheduleOpen} 
            onClose={() => setIsRescheduleOpen(false)} 
            onSave={handleReschedule}
            title={t('rescheduleModal.title')}
        />
    </div>
  );
};

export default Countdown;