import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { AgendaIcon, DocumentTextIcon, CogIcon, ClockIcon, ChatBubbleLeftEllipsisIcon, BellIcon, TaskIcon, ChartBarIcon, UserIcon } from './Icons';
import ThemeToggle from './ThemeToggle';
import { useSettings } from '../hooks/useSettings';

interface TopNavProps {
  currentView: 'followUps' | 'clients' | 'budgets' | 'corporate' | 'tasks' | 'performance';
  setCurrentView: (view: 'followUps' | 'clients' | 'budgets' | 'corporate' | 'tasks' | 'performance') => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  notificationCount: number;
  unreadNotificationCount: number;
}

export const TopNav: React.FC<TopNavProps> = (props) => {
    const { currentView, setCurrentView, onOpenSettings, onOpenProfile, onOpenNotifications, notificationCount, unreadNotificationCount } = props;
    const { t } = useTranslation();
    const { settings } = useSettings();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [settings.userPhoto]);

    const NavButton: React.FC<{ view: 'followUps' | 'clients' | 'budgets' | 'corporate' | 'tasks' | 'performance'; icon: React.ReactNode; label: string; count?: number }> = ({ view, icon, label, count }) => {
        const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        };
        
        return (
         <button
            onFocus={handleFocus}
            onClick={() => setCurrentView(view)}
            className={`relative flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === view
                ? 'bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
            }`}
            aria-pressed={currentView === view}
        >
            {icon}
            <span className="hidden md:inline ml-2">{label}</span>
            {count && count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {count}
                </span>
            )}
        </button>
    )};

    return (
        <header className="relative p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center flex-shrink-0 mr-2">
            <span className="text-xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 text-transparent bg-clip-text">
                AGUAI
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div ref={scrollContainerRef} className="overflow-x-auto custom-scrollbar">
                <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <NavButton view="followUps" icon={<ClockIcon className="w-5 h-5" />} label={t('followUps.title')} />
                    <NavButton view="corporate" icon={<ChatBubbleLeftEllipsisIcon className="w-5 h-5" />} label={t('topNav.chatLeads')} count={notificationCount} />
                    <NavButton view="tasks" icon={<TaskIcon className="w-5 h-5" />} label={t('tasks.title')} />
                    <NavButton view="budgets" icon={<DocumentTextIcon className="w-5 h-5" />} label={t('budgets.title')} />
                    <NavButton view="clients" icon={<AgendaIcon className="w-5 h-5" />} label={t('agenda.title')} />
                    <NavButton view="performance" icon={<ChartBarIcon className="w-5 h-5" />} label={t('performance.title')} />
                </div>
            </div>
          </div>


          <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
            <button onClick={onOpenNotifications} className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <BellIcon className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                )}
            </button>
            <button onClick={onOpenSettings} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              <CogIcon className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <button onClick={onOpenProfile} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Open profile">
                {(settings.userPhoto && !imgError) ? (
                    <img 
                        src={settings.userPhoto} 
                        alt="User Profile" 
                        className="w-6 h-6 rounded-full object-cover" 
                        onError={() => {
                            console.warn('Failed to load user profile image.');
                            setImgError(true);
                        }}
                    />
                ) : (
                    <UserIcon className="w-6 h-6" />
                )}
            </button>
          </div>
        </header>
    );
}