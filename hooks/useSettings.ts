import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { OperatingMode, ConnectedUser } from '../types';
import { useTranslation } from './useTranslation';
import { AguaiUserProfile } from '../services/aguaiService';

export interface AppSettings {
  companyName: string;
  logo: string | null; // base64 string
  mode: OperatingMode;
  userId: string;
  userName: string;
  hostPin: string | null;
  connectedUsers: ConnectedUser[];
  blockedUsers: string[]; // Array of user IDs
  readReceiptsEnabled: boolean;
  notificationStatus: 'enabled' | 'muted';
  notificationSound: string; // e.g., 'brisa.mp3', 'silent', 'custom'
  customNotificationSound: string | null; // Data URL for custom sound
  userPhoto: string | null;
  userFullName: string;
  userNickname: string;
  userEmail: string;
  userPhone: string;
  isSessionPersistent: boolean;
  googleDriveLinked: boolean;
  isAguaiUser: boolean;
  aguaiToken: string | null;
}

interface SettingsContextType {
  settings: AppSettings;
  setLogo: (logo: string | null) => void;
  setCompanyName: (name: string) => void;
  setMode: (mode: OperatingMode) => void;
  startHostSession: () => void;
  stopHostSession: () => void;
  regeneratePin: () => void;
  joinHostSession: (pin: string) => boolean;
  leaveClientSession: () => void;
  removeUser: (userId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isNewHostSession: boolean;
  setIsNewHostSession: (isNew: boolean) => void;
  setReadReceiptsEnabled: (enabled: boolean) => void;
  setNotificationStatus: (status: 'enabled' | 'muted') => void;
  setNotificationSound: (sound: string) => void;
  setCustomNotificationSound: (soundData: string | null) => void;
  playNotificationSound: () => void;
  setUserPhoto: (photo: string | null) => void;
  setUserFullName: (name: string) => void;
  setUserNickname: (name: string) => void;
  setUserEmail: (email: string) => void;
  setUserPhone: (phone: string) => void;
  setIsSessionPersistent: (isPersistent: boolean) => void;
  setGoogleDriveLinked: (isLinked: boolean) => void;
  loginAguai: (profile: AguaiUserProfile) => void;
  logoutAguai: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'crm_settings';

const getInitialSettings = (): AppSettings => {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    const userId = localStorage.getItem('crm_user_id') || `user_${crypto.randomUUID()}`;
    localStorage.setItem('crm_user_id', userId);

    const defaultSettings: AppSettings = {
      companyName: 'My Company',
      logo: null,
      mode: 'individual',
      userId: userId,
      userName: `User ${userId.substring(5, 9)}`,
      hostPin: null,
      connectedUsers: [],
      blockedUsers: [],
      readReceiptsEnabled: true,
      notificationStatus: 'enabled',
      notificationSound: 'brisa.mp3',
      customNotificationSound: null,
      userPhoto: null,
      userFullName: '',
      userNickname: `User ${userId.substring(5, 9)}`,
      userEmail: '',
      userPhone: '',
      isSessionPersistent: false,
      googleDriveLinked: false,
      isAguaiUser: false,
      aguaiToken: null,
    };
    return item ? { ...defaultSettings, ...JSON.parse(item) } : defaultSettings;
  } catch (error) {
    console.error('Error reading settings from localStorage', error);
    const userId = `user_${crypto.randomUUID()}`;
    return {
      companyName: 'My Company',
      logo: null,
      mode: 'individual',
      userId: userId,
      userName: `User ${userId.substring(5, 9)}`,
      hostPin: null,
      connectedUsers: [],
      blockedUsers: [],
      readReceiptsEnabled: true,
      notificationStatus: 'enabled',
      notificationSound: 'brisa.mp3',
      customNotificationSound: null,
      userPhoto: null,
      userFullName: '',
      userNickname: `User ${userId.substring(5, 9)}`,
      userEmail: '',
      userPhone: '',
      isSessionPersistent: false,
      googleDriveLinked: false,
      isAguaiUser: false,
      aguaiToken: null,
    };
  }
};

const generatePin = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';
    for (let i = 0; i < 3; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 3; i++) {
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return result;
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const [isNewHostSession, setIsNewHostSession] = useState(false);
  const { t } = useTranslation();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const audioQueueRef = useRef<(() => void)[]>([]);


  useEffect(() => {
    const unlockAudio = () => {
      if (isAudioUnlocked) return;

      const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
      silentAudio.volume = 0;
      silentAudio.play().then(() => {
        setIsAudioUnlocked(true);
        console.log("Audio context has been unlocked by user gesture.");
        audioQueueRef.current.forEach(playFunc => playFunc());
        audioQueueRef.current = [];
      }).catch(error => {
        setIsAudioUnlocked(true); 
        console.warn("Silent audio playback for unlocking failed, but assuming context is now available.", error);
        audioQueueRef.current.forEach(playFunc => playFunc());
        audioQueueRef.current = [];
      });

      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [isAudioUnlocked]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error writing settings to localStorage', error);
    }
  }, [settings]);

  useEffect(() => {
    const showNotification = (message: string) => {
        if ('Notification' in window && Notification.permission === 'granted' && settings.notificationStatus === 'enabled') {
            new Notification('AGUAI', { body: message, silent: settings.notificationStatus === 'muted' });
        }
    };
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }

      setSettings(currentSettings => {
        if (currentSettings.mode === 'client') {
          try {
            const newSettingsFromStorage: AppSettings = JSON.parse(event.newValue!);
            const amIStillConnected = newSettingsFromStorage.connectedUsers.some(user => user.id === currentSettings.userId);

            if (!amIStillConnected) {
              showNotification(t('notifications.hostConnectionLost'));
              return { ...currentSettings, mode: 'individual' };
            }
          } catch (error) {
            console.error('Error parsing settings from storage', error);
          }
        }
        return currentSettings;
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [t, settings.notificationStatus]);
  
  const setLogo = useCallback((logo: string | null) => {
      setSettings(prev => ({...prev, logo}));
  }, []);

  const setCompanyName = useCallback((name: string) => {
      setSettings(prev => ({...prev, companyName: name}));
  }, []);

  const setMode = useCallback((mode: OperatingMode) => {
      setSettings(prev => ({...prev, mode}));
  }, []);

  const startHostSession = useCallback(() => {
    setIsNewHostSession(true);
    setSettings(prev => ({
        ...prev,
        mode: 'host',
        hostPin: generatePin(),
        connectedUsers: [],
        blockedUsers: [],
    }));
  }, []);

  const stopHostSession = useCallback(() => {
    setSettings(prev => ({
        ...prev,
        mode: 'individual',
        hostPin: null,
        connectedUsers: [],
        blockedUsers: [],
    }));
  }, []);

  const regeneratePin = useCallback(() => {
      setSettings(prev => ({
          ...prev,
          hostPin: generatePin(),
          connectedUsers: [], // Disconnect all users
      }))
  }, []);
  
  const joinHostSession = useCallback((pin: string): boolean => {
      if (settings.mode !== 'host') { 
          const hostSettings: AppSettings = getInitialSettings(); 
          if (hostSettings.mode === 'host' && hostSettings.hostPin === pin.toUpperCase() && !hostSettings.blockedUsers.includes(settings.userId)) {
              const updatedHostSettings = {
                  ...hostSettings,
                  connectedUsers: [...hostSettings.connectedUsers.filter(u => u.id !== settings.userId), { id: settings.userId, name: settings.userName }]
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHostSettings));
              setSettings(prev => ({...prev, mode: 'client'}));
              return true;
          }
      } else { 
          if (settings.hostPin === pin.toUpperCase() && !settings.blockedUsers.includes(settings.userId)) {
              setSettings(prev => ({...prev, mode: 'client'}));
              return true;
          }
      }
      return false;
  }, [settings.userId, settings.userName, settings.hostPin, settings.blockedUsers, settings.mode]);

  const leaveClientSession = useCallback(() => {
      const hostSettings: AppSettings = getInitialSettings();
      if (hostSettings.mode === 'host') {
          const updatedHostSettings = {
              ...hostSettings,
              connectedUsers: hostSettings.connectedUsers.filter(u => u.id !== settings.userId)
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHostSettings));
      }
      setSettings(prev => ({...prev, mode: 'individual'}));
  }, [settings.userId]);

  const removeUser = useCallback((userId: string) => {
      setSettings(prev => ({
          ...prev,
          connectedUsers: prev.connectedUsers.filter(u => u.id !== userId)
      }));
  }, []);
  
  const blockUser = useCallback((userId: string) => {
      setSettings(prev => ({
          ...prev,
          connectedUsers: prev.connectedUsers.filter(u => u.id !== userId),
          blockedUsers: [...new Set([...prev.blockedUsers, userId])]
      }));
  }, []);

  const unblockUser = useCallback((userId: string) => {
    setSettings(prev => ({
        ...prev,
        blockedUsers: prev.blockedUsers.filter(id => id !== userId)
    }));
  }, []);
  
  const setReadReceiptsEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, readReceiptsEnabled: enabled }));
  }, []);

  const setUserPhoto = useCallback((photo: string | null) => setSettings(prev => ({ ...prev, userPhoto: photo })), []);
  const setUserFullName = useCallback((name: string) => setSettings(prev => ({ ...prev, userFullName: name })), []);
  const setUserNickname = useCallback((name: string) => setSettings(prev => ({ ...prev, userNickname: name })), []);
  const setUserEmail = useCallback((email: string) => setSettings(prev => ({ ...prev, userEmail: email })), []);
  const setUserPhone = useCallback((phone: string) => setSettings(prev => ({ ...prev, userPhone: phone })), []);
  const setIsSessionPersistent = useCallback((isPersistent: boolean) => setSettings(prev => ({ ...prev, isSessionPersistent: isPersistent })), []);
  const setGoogleDriveLinked = useCallback((isLinked: boolean) => setSettings(prev => ({ ...prev, googleDriveLinked: isLinked })), []);

  const setNotificationStatus = useCallback((status: 'enabled' | 'muted') => {
      setSettings(prev => ({ ...prev, notificationStatus: status }));
  }, []);

  const setNotificationSound = useCallback((sound: string) => {
    setSettings(prev => ({...prev, notificationSound: sound}));
  }, []);

  const setCustomNotificationSound = useCallback((soundData: string | null) => {
      setSettings(prev => ({...prev, customNotificationSound: soundData}));
  }, []);
  
  const playNotificationSound = useCallback(() => {
    const actualPlay = () => {
      if (settings.notificationStatus === 'muted' || settings.notificationSound === 'silent') {
        return;
      }
      
      if (!audioRef.current) {
          audioRef.current = new Audio();
      }
      const audio = audioRef.current;

      audio.onerror = () => {
          console.error(`Failed to load audio: ${audio.src}`);
          if (settings.notificationSound === 'custom') {
              console.warn(t('alerts.customSoundLoadError'));
              setSettings(prev => ({...prev, notificationSound: 'silent'}));
          }
      };

      if (audio && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
      }
      
      let src = '';
      if (settings.notificationSound === 'custom' && settings.customNotificationSound) {
          src = settings.customNotificationSound;
      } else if (settings.notificationSound !== 'custom' && settings.notificationSound !== 'silent') {
          src = `/assets/aguai/sounds/${settings.notificationSound}`;
      }

      if (!src) {
          if(settings.notificationSound === 'custom') {
              console.warn(t('alerts.customSoundLoadError'));
              setSettings(prev => ({...prev, notificationSound: 'silent'}));
          }
          return;
      }
      
      audio.src = src;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Error playing notification sound:", error);
            if (settings.notificationSound === 'custom') {
                console.warn(t('alerts.customSoundLoadError'));
                setSettings(prev => ({...prev, notificationSound: 'silent'}));
            }
        });
      }
    };

    if (!isAudioUnlocked) {
      console.warn("Audio not unlocked. Queuing notification sound.");
      audioQueueRef.current.push(actualPlay);
      return;
    }
    actualPlay();
  }, [settings.notificationStatus, settings.notificationSound, settings.customNotificationSound, isAudioUnlocked, t, setSettings]);

  const loginAguai = useCallback((profile: AguaiUserProfile) => {
    setSettings(prev => ({
      ...prev,
      isAguaiUser: true,
      aguaiToken: profile.token,
      userNickname: profile.nickname,
      userFullName: profile.username,
      userPhoto: profile.profilePhotoUrl,
    }));
  }, []);

  const logoutAguai = useCallback(() => {
    const token = settings.aguaiToken;
    if (token) {
        // In a real app, call: aguaiService.logout(token);
    }
    setSettings(prev => ({
      ...prev,
      isAguaiUser: false,
      aguaiToken: null,
      userNickname: `User ${prev.userId.substring(5, 9)}`,
      userFullName: '',
      userPhoto: null,
    }));
  }, [settings.aguaiToken]);


  const value = useMemo(() => ({
      settings,
      setLogo,
      setCompanyName,
      setMode,
      startHostSession,
      stopHostSession,
      regeneratePin,
      joinHostSession,
      leaveClientSession,
      removeUser,
      blockUser,
      unblockUser,
      isNewHostSession,
      setIsNewHostSession,
      setReadReceiptsEnabled,
      setNotificationStatus,
      setNotificationSound,
      setCustomNotificationSound,
      playNotificationSound,
      setUserPhoto,
      setUserFullName,
      setUserNickname,
      setUserEmail,
      setUserPhone,
      // FIX: Changed isSessionPersistent to setIsSessionPersistent
      setIsSessionPersistent,
      setGoogleDriveLinked,
      loginAguai,
      logoutAguai,
  }), [settings, setLogo, setCompanyName, setMode, startHostSession, stopHostSession, regeneratePin, joinHostSession, leaveClientSession, removeUser, blockUser, unblockUser, isNewHostSession, setReadReceiptsEnabled, setNotificationStatus, setNotificationSound, setCustomNotificationSound, playNotificationSound, setUserPhoto, setUserFullName, setUserNickname, setUserEmail, setUserPhone, setIsSessionPersistent, setGoogleDriveLinked, loginAguai, logoutAguai]);

  return React.createElement(SettingsContext.Provider, { value }, children);
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
