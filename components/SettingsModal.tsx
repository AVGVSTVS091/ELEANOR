import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { UploadIcon } from './Icons';
import { useSettings } from '../hooks/useSettings';
import { fileToBase64 } from '../utils/fileUtils';
import HostSetupModal from './HostSetupModal';
import JoinHostModal from './JoinHostModal';
import OperatingModeSelector from './OperatingModeSelector';
import CloseButton from './CloseButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogoUploader: React.FC = () => {
    const { settings, setLogo } = useSettings();
    const { t } = useTranslation();

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            setLogo(`data:${file.type};base64,${base64}`);
        }
    };

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('settings.branding')}</h3>
            <div className="flex items-center space-x-4">
                {settings.logo ? (
                    <img src={settings.logo} alt="Company Logo" className="w-16 h-16 object-contain rounded-md bg-gray-100 dark:bg-gray-600" />
                ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-400">
                        <UploadIcon className="w-8 h-8" />
                    </div>
                )}
                <div>
                    <label htmlFor="logo-upload" className="cursor-pointer text-sm font-medium text-green-600 dark:text-indigo-400 hover:text-green-500">
                        {settings.logo ? t('priceList.replace') : t('fileUpload.selectFile')}
                    </label>
                    <input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoChange} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('settings.logoHelp')}</p>
                </div>
            </div>
        </div>
    );
};

const NotificationSoundSelector: React.FC = () => {
  const { settings, setNotificationSound, setCustomNotificationSound } = useSettings();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);

  const builtInSounds = [
    { id: 'brisa.mp3', name: t('settings.notifications.sound.breeze') },
    { id: 'eco.mp3', name: t('settings.notifications.sound.echo') },
    { id: 'gota.mp3', name: t('settings.notifications.sound.drop') },
    { id: 'pulso.mp3', name: t('settings.notifications.sound.pulse') },
    { id: 'luz.mp3', name: t('settings.notifications.sound.light') },
    { id: 'tinta.mp3', name: t('settings.notifications.sound.ink') },
    { id: 'campana.mp3', name: t('settings.notifications.sound.bell') },
    { id: 'madera.mp3', name: t('settings.notifications.sound.wood') },
    { id: 'cristal.mp3', name: t('settings.notifications.sound.crystal') },
    { id: 'aire.mp3', name: t('settings.notifications.sound.air') },
  ];

  const playPreview = (soundFile: string, customData?: string) => {
    if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio();
    }
    const audio = audioPreviewRef.current;

    audio.onerror = () => {
        console.error(`Failed to load preview audio: ${audio.src}`);
        console.warn(t('alerts.customSoundLoadError')); // Reusing this alert for any sound load failure
        setNotificationSound('silent');
    };

    if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
    }

    if (soundFile === 'silent') return;

    let src = '';
    if (soundFile === 'custom' || soundFile === 'custom_trigger') {
      const data = customData || settings.customNotificationSound;
      if (data) src = data;
      else return; // No custom sound to play
    } else {
      // Path updated for public/assets folder
      src = `/assets/aguai/sounds/${soundFile}`;
    }
    
    audio.src = src;
    audio.play().catch(e => {
        console.error("Audio preview failed", e);
        if (soundFile === 'custom' || soundFile === 'custom_trigger') {
            console.warn(t('alerts.customSoundLoadError'));
            setNotificationSound('silent');
        }
    });
  };

  const handleSoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom_trigger') {
      fileInputRef.current?.click();
    } else {
      setNotificationSound(value);
      if (value !== 'custom') {
        setCustomFileName(null);
      }
      playPreview(value);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.ogg'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCustomNotificationSound(dataUrl);
        setNotificationSound('custom');
        setCustomFileName(file.name);
        playPreview('custom', dataUrl);
      };
      reader.readAsDataURL(file);
    } else if (file) {
        console.warn('Unsupported audio format.');
    }
  };

  let displayValue = settings.notificationSound;
  if (settings.notificationSound === 'custom' && !settings.customNotificationSound) {
    displayValue = 'silent';
  }

  return (
    <div>
      <label htmlFor="sound-select" className="block text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
        {t('settings.notifications.soundTitle')}
      </label>
      <select
        id="sound-select"
        value={displayValue === 'custom' ? 'custom_trigger' : displayValue}
        onChange={handleSoundChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
      >
        {builtInSounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        <option value="silent">{t('settings.notifications.sound.silent')}</option>
        <option value="custom_trigger">{t('settings.notifications.sound.custom')}</option>
      </select>
      {settings.notificationSound === 'custom' && settings.customNotificationSound && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('settings.notifications.sound.customFile')}: {customFileName || 'sound.mp3'}
          </p>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/mp3,audio/wav,audio/ogg" />
    </div>
  );
};


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const { settings, setReadReceiptsEnabled, setNotificationStatus } = useSettings();
  const [isHostSetupOpen, setIsHostSetupOpen] = useState(false);
  const [isJoinHostOpen, setIsJoinHostOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);


  const languages = {
    en: 'English',
    es: 'Español',
    pt: 'Português',
    it: 'Italiano',
    de: 'Deutsch'
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div ref={modalRef} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-gray-100">{t('settings.title')}</h2>
            <CloseButton onClose={onClose} />
          </div>
          
          <div className="space-y-6">
            {/* Operating Mode Section */}
            <OperatingModeSelector 
              onSelectHost={() => setIsHostSetupOpen(true)}
              onSelectJoinHost={() => setIsJoinHostOpen(true)}
            />

            {/* Appearance Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('settings.appearance')}</h3>
              <div className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none ${
                      theme === mode
                        ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-indigo-400 shadow'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t(`settings.${mode}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Section */}
            <div>
              <label htmlFor="language-select" className="block text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                {t('settings.language')}
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as keyof typeof languages)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              >
                {Object.entries(languages).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            {/* Notifications Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('settings.notifications.title')}</h3>
              <div className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                {(['enabled', 'muted'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setNotificationStatus(status)}
                    className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none ${
                      settings.notificationStatus === status
                        ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-indigo-400 shadow'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t(`settings.notifications.${status}`)}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <NotificationSoundSelector />
              </div>
            </div>

            {/* Read Receipts Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('settings.readReceipts.title')}</h3>
              <div className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                  <button
                    onClick={() => setReadReceiptsEnabled(true)}
                    className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none ${
                      settings.readReceiptsEnabled
                        ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-indigo-400 shadow'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('common.enabled')}
                  </button>
                  <button
                    onClick={() => setReadReceiptsEnabled(false)}
                    className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none ${
                      !settings.readReceiptsEnabled
                        ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-indigo-400 shadow'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('common.disabled')}
                  </button>
              </div>
            </div>
            
            <LogoUploader />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  Developed by: J.A Ibarra
              </p>
          </div>
        </div>
      </div>
      <HostSetupModal isOpen={isHostSetupOpen} onClose={() => { setIsHostSetupOpen(false); }} />
      <JoinHostModal isOpen={isJoinHostOpen} onClose={() => { setIsJoinHostOpen(false); }} />
    </>
  );
};

export default SettingsModal;