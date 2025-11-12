import React from 'react';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';

interface OperatingModeSelectorProps {
    onSelectHost: () => void;
    onSelectJoinHost: () => void;
}

const OperatingModeSelector: React.FC<OperatingModeSelectorProps> = ({ onSelectHost, onSelectJoinHost }) => {
    const { settings, leaveClientSession, stopHostSession } = useSettings();
    const { t } = useTranslation();

    const modes = [
        { id: 'individual', label: t('settings.mode.individual') },
        { id: 'joinHost', label: t('settings.mode.joinHost') },
        { id: 'host', label: t('settings.mode.host') },
    ];
    
    // Determine current effective mode for UI selection
    const currentModeId = settings.mode === 'client' ? 'joinHost' : (settings.mode === 'host' ? 'host' : 'individual');

    const handleModeChange = (modeId: string) => {
        if (modeId === 'individual') {
            if (settings.mode === 'client') leaveClientSession();
            if (settings.mode === 'host') {
                if(window.confirm(t('hostPanel.stopHosting.confirm'))) {
                    stopHostSession();
                }
            }
        } else if (modeId === 'joinHost') {
            onSelectJoinHost();
        } else if (modeId === 'host') {
            onSelectHost();
        }
    }

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('settings.operatingMode')}</h3>
            <div className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => handleModeChange(mode.id)}
                        className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none ${
                            currentModeId === mode.id
                                ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-indigo-400 shadow'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600'
                        }`}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default OperatingModeSelector;