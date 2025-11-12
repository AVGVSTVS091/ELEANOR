

import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { Client, Lead, Budget, Task, AppNotification, ConversationStatus } from './types';
import { useClients } from './hooks/useClients';
import { useLeads } from './hooks/useLeads';
import { useTasks } from './hooks/useTasks';
import ClientList from './components/ClientList';
import { ExcelImporter } from './components/ExcelImporter';
import { PlusCircleIcon, UserGroupIcon, CloudUploadIcon, CameraIcon, QrCodeIcon, PencilIcon, AgendaIcon, ChatBubbleIcon, XMarkIcon } from './components/Icons';
import { GoogleDriveImporter } from './components/GoogleDriveImporter';
import { useTranslation } from './hooks/useTranslation';
import { TopNav } from './components/TopNav';
import { useSettings } from './hooks/useSettings';
import { FileSystemService } from './services/FileSystemService';
import { LicenseService } from './services/LicenseService';
import { RemoteControlService } from './services/RemoteControlService';

// --- Lazy Loaded Components ---

const FullScreenLoader: React.FC = () => (
    <div className="flex items-center justify-center h-full text-gray-500/80 dark:text-gray-400/80">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
    </div>
);

const ClientDetail = lazy(() => import('./components/ClientDetail'));
const Chatbot = lazy(() => import('./components/Chatbot'));
const ClientForm = lazy(() => import('./components/ClientForm'));
const MultiClientForm = lazy(() => import('./components/MultiClientForm'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const ProfileModal = lazy(() => import('./components/ProfileModal'));
const CameraScanner = lazy(() => import('./components/CameraScanner'));
const BudgetsPage = lazy(() => import('./components/BudgetsPage'));
const FollowUpPage = lazy(() => import('./components/FollowUpPage'));
const HostManagementPanel = lazy(() => import('./components/HostManagementPanel'));
const CorporateLeadsPage = lazy(() => import('./components/CorporateLeadsPage'));
const ChatView = lazy(() => import('./components/LeadChatView'));
const SendBudgetConfirmModal = lazy(() => import('./components/SendBudgetConfirmModal'));
const EnterLeadNameModal = lazy(() => import('./components/EnterLeadNameModal'));
const BudgetGeneratorPanel = lazy(() => import('./components/BudgetGeneratorPanel'));
const TasksPage = lazy(() => import('./components/TasksPage'));
const TaskFormModal = lazy(() => import('./components/TaskFormModal'));
const NotificationsPanel = lazy(() => import('./components/NotificationsPanel'));
const PerformancePage = lazy(() => import('./components/PerformancePage'));


interface MobileAddActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenForm: () => void;
  onOpenMultiForm: () => void;
  onTriggerExcelImport: () => void;
  onTriggerDriveImport: () => void;
  onOpenCameraScanner: () => void;
  onOpenQrScanner: () => void;
}

const MobileAddActions: React.FC<MobileAddActionsProps> = ({
  isOpen,
  onClose,
  onOpenForm,
  onOpenMultiForm,
  onTriggerExcelImport,
  onTriggerDriveImport,
  onOpenCameraScanner,
  onOpenQrScanner
}) => {
  const { t } = useTranslation();

  const actions = [
    { label: t('addContact.manual'), icon: <PencilIcon className="w-7 h-7" />, action: onOpenForm },
    { label: t('addContact.camera'), icon: <CameraIcon className="w-7 h-7" />, action: onOpenCameraScanner },
    { label: t('addContact.qr'), icon: <QrCodeIcon className="w-7 h-7" />, action: onOpenQrScanner },
    { label: t('sidebar.addMultiple'), icon: <UserGroupIcon className="w-7 h-7" />, action: onOpenMultiForm },
    { label: t('sidebar.fromExcel'), icon: <CloudUploadIcon className="w-7 h-7" />, action: onTriggerExcelImport },
    { label: t('sidebar.fromDrive'), icon: <CloudUploadIcon className="w-7 h-7" />, action: onTriggerDriveImport },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isOpen ? 'bg-opacity-50 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      ></div>

      {/* Slide-up Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-4 shadow-2xl z-50 transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-contact-heading"
      >
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
        <h2 id="add-contact-heading" className="sr-only">{t('sidebar.addContact')}</h2>
        <div className="grid grid-cols-3 gap-4 pt-2">
          {actions.map((item, index) => (
            <button
              key={index}
              onClick={() => { item.action(); onClose(); }}
              className="flex flex-col items-center justify-center space-y-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {item.icon}
              <span className="text-sm font-medium text-center text-gray-700 dark:text-gray-200">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

const BottomNav: React.FC<{
  onOpenAgenda: () => void;
  onOpenAddMenu: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
}> = ({ onOpenAgenda, onOpenAddMenu, isChatOpen, onToggleChat }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center z-30 md:hidden">
      <button onClick={onOpenAgenda} className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 w-20 pt-1">
        <AgendaIcon className="w-6 h-6" />
        <span className="text-xs">{t('agenda.title')}</span>
      </button>
      
      <button
        onClick={onOpenAddMenu}
        className="w-16 h-16 -mt-8 rounded-full text-white shadow-lg flex items-center justify-center bg-gradient-to-r from-sky-500 to-emerald-500 transition-transform transform hover:scale-110"
        aria-label={t('sidebar.addContact')}
      >
        <PlusCircleIcon className="w-9 h-9" />
      </button>

      <button onClick={onToggleChat} className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 w-20 pt-1">
        {isChatOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleIcon className="w-6 h-6" />}
        <span className="text-xs">{isChatOpen ? t('clientForm.cancel') : t('chatbot.header')}</span>
      </button>
    </div>
  );
};

interface DesktopFloatingActionsProps {
  onOpenForm: () => void;
  onOpenMultiForm: () => void;
  onTriggerExcelImport: () => void;
  onTriggerDriveImport: () => void;
  onOpenCameraScanner: () => void;
  onOpenQrScanner: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onOpenAgenda: () => void;
  onOpenHostPanel: () => void;
}

const DesktopFloatingActions: React.FC<DesktopFloatingActionsProps> = ({
  onOpenForm,
  onOpenMultiForm,
  onTriggerExcelImport,
  onTriggerDriveImport,
  onOpenCameraScanner,
  onOpenQrScanner,
  onToggleChat,
  isChatOpen,
  onOpenAgenda,
  onOpenHostPanel,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const { settings } = useSettings();

  const actions = [
    { label: t('addContact.manual'), icon: <PencilIcon className="w-7 h-7" />, action: onOpenForm },
    { label: t('addContact.camera'), icon: <CameraIcon className="w-7 h-7" />, action: onOpenCameraScanner },
    { label: t('addContact.qr'), icon: <QrCodeIcon className="w-7 h-7" />, action: onOpenQrScanner },
    { label: t('sidebar.addMultiple'), icon: <UserGroupIcon className="w-7 h-7" />, action: onOpenMultiForm },
    { label: t('sidebar.fromExcel'), icon: <CloudUploadIcon className="w-7 h-7" />, action: onTriggerExcelImport },
    { label: t('sidebar.fromDrive'), icon: <CloudUploadIcon className="w-7 h-7" />, action: onTriggerDriveImport },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isAddMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddMenuOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-30 hidden md:flex flex-col-reverse items-end gap-4">
      {/* Add button and menu */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className="w-16 h-16 rounded-full text-white shadow-lg flex items-center justify-center bg-gradient-to-r from-sky-500 to-emerald-500 transition-transform transform hover:scale-110"
          aria-haspopup="true"
          aria-expanded={isAddMenuOpen}
          aria-label={t('sidebar.addContact')}
        >
          <PlusCircleIcon className="w-9 h-9" />
        </button>
        {isAddMenuOpen && (
          <div
            ref={menuRef}
            className="absolute bottom-full right-0 mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-80"
          >
            <div className="grid grid-cols-3 gap-4">
              {actions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => { item.action(); setIsAddMenuOpen(false); }}
                  className="flex flex-col items-center justify-center space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {item.icon}
                  <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-200">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat button */}
      <button
        onClick={onToggleChat}
        className="bg-white dark:bg-gray-700 rounded-full p-4 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        aria-label={isChatOpen ? t('clientForm.cancel') : t('chatbot.header')}
      >
        {isChatOpen ? (
          <XMarkIcon className="w-7 h-7 text-gray-700 dark:text-gray-200" />
        ) : (
          <ChatBubbleIcon className="w-7 h-7 text-sky-500 dark:text-sky-400" />
        )}
      </button>

      {/* Agenda button */}
      <button
        onClick={onOpenAgenda}
        className="bg-white dark:bg-gray-700 rounded-full p-4 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        aria-label={t('agenda.title')}
      >
        <AgendaIcon className="w-7 h-7 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Host Panel button */}
      {settings.mode === 'host' && (
        <button
            onClick={onOpenHostPanel}
            className="bg-white dark:bg-gray-700 rounded-full p-4 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            aria-label={t('hostPanel.title')}
        >
            <UserGroupIcon className="w-7 h-7 text-sky-500 dark:text-sky-400" />
        </button>
      )}
    </div>
  );
};


const App: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, importClients, addBudgetToClient, deleteBudgetFromClient } = useClients();
  const { leads, setLeads, updateLead, addLead, initializeLeads } = useLeads();
  const { tasks, addTask, updateTask, deleteTask, deleteMultipleTasks } = useTasks();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMultiClientFormOpen, setIsMultiClientFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { t } = useTranslation();
  const excelInputRef = useRef<HTMLInputElement>(null);
  const driveInputRef = useRef<HTMLInputElement>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'card' | 'qr'>('card');
  const [currentView, setCurrentView] = useState<'followUps' | 'clients' | 'budgets' | 'corporate' | 'tasks' | 'performance'>('clients');
  const [initialBudgetInfo, setInitialBudgetInfo] = useState<{clientId?: string, tab: 'new', leadName?: string} | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHostPanelOpen, setIsHostPanelOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskOrigin, setTaskOrigin] = useState<{ originType: 'chat', originId: string, originName: string } | undefined>(undefined);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const NOTIFIED_TASKS_KEY = 'notified_tasks';
  const { settings, playNotificationSound } = useSettings();


  // Corporate state
  const [notificationCount, setNotificationCount] = useState(0);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isConfirmBudgetModalOpen, setIsConfirmBudgetModalOpen] = useState(false);
  const [pendingBudgetForLead, setPendingBudgetForLead] = useState<{ budget: Omit<Budget, 'id'>, lead: Lead } | null>(null);
  const [isEnterLeadNameModalOpen, setIsEnterLeadNameModalOpen] = useState(false);
  const [leadToSave, setLeadToSave] = useState<Lead | null>(null);
  const [chattingClient, setChattingClient] = useState<Client | null>(null);
  const [budgetGeneratorState, setBudgetGeneratorState] = useState<{ isOpen: boolean; contact: Client | Lead | null }>({ isOpen: false, contact: null });
  const [sharedBudget, setSharedBudget] = useState<Omit<Budget, 'id'> | null>(null);
  const simulationRun = useRef(false);


  const selectedLead = useMemo(() => {
      return leads.find(l => l.id === selectedLeadId) ?? null;
  }, [leads, selectedLeadId]);
  
  const activeChatContact = chattingClient
    ? clients.find(c => c.id === chattingClient.id) ?? chattingClient
    : selectedLead;

  const showFloatingButtons = (currentView === 'clients' || currentView === 'followUps') && !selectedClientId && !activeChatContact;

  // System Initialization
  useEffect(() => {
    const initSystem = async () => {
        // Create folder structure (config, user, chat, etc.) and manifest
        await FileSystemService.initialize();
        
        // Initialize licensing and membership logic
        LicenseService.initialize();
        
        // Start listening for remote admin commands
        RemoteControlService.listenForCommands();
    };
    
    initSystem();
  }, []);

  useEffect(() => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        // The logo animation is 0.9s. We wait for it to finish then start fading.
        setTimeout(() => {
            splashScreen.classList.add('splash-fade-out');
            
            // After the fade-out transition (300ms), remove the element.
            splashScreen.addEventListener('transitionend', () => {
                splashScreen.remove();
            }, { once: true });

        }, 900); 
    }
  }, []);

  useEffect(() => {
    initializeLeads();
  }, [initializeLeads]);

  useEffect(() => {
      const unread = leads.reduce((sum, lead) => sum + lead.unreadCount, 0);
      setNotificationCount(unread);

      if (!simulationRun.current && leads.length > 0) {
          const newLeadTimer = setTimeout(() => {
              if (!leads.some(l => l.name === 'New Inquiry')) {
                  const newLead: Omit<Lead, 'id'> = { name: 'New Inquiry', lastMessage: 'What are your payment terms?', timestamp: new Date().toISOString(), unreadCount: 1, language: 'es' };
                  addLead(newLead);
                  playNotificationSound();
              }
          }, 5000);
          
          simulationRun.current = true;
          return () => clearTimeout(newLeadTimer);
      }
  }, [leads, addLead, playNotificationSound]);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientIdFromUrl = params.get('clientId');
    if (clientIdFromUrl && clients.some(c => c.id === clientIdFromUrl)) {
      setSelectedClientId(clientIdFromUrl);
    }
     if (selectedClientId && !clients.some(c => c.id === selectedClientId)) {
      setSelectedClientId(null);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const showNotification = (client: Client) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(t('notifications.followUp.title'), {
          body: t('notifications.followUp.body', { clientName: client.companyName }),
          tag: `followup-${client.id}`
        });
        
        notification.onclick = () => {
          window.open(`${window.location.pathname}?clientId=${client.id}`, '_blank');
        };
      }
    };

    const checkFollowUps = () => {
      const NOTIFIED_KEY = 'notified_followups_due';
      const notifiedFollowUpIds: string[] = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]');
      const updatedNotifiedIds = [...notifiedFollowUpIds];
      let hasChanges = false;
      const now = new Date();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      clients.forEach(client => {
        if (!client.nextFollowUpDate) return;
        
        const dueDate = new Date(client.nextFollowUpDate);
        
        if (!notifiedFollowUpIds.includes(client.id) && now >= dueDate) {
          showNotification(client);
          updatedNotifiedIds.push(client.id);
          hasChanges = true;
        }

        const timeSinceDue = now.getTime() - dueDate.getTime();
        if (timeSinceDue > oneDayInMs && client.status !== 'suspended' && !client.isPaused) {
            updateClient(client.id, { status: 'suspended' });
        }
      });
      
      const activeFollowUpIds = new Set(clients.filter(c => c.nextFollowUpDate && new Date(c.nextFollowUpDate) > now).map(c => c.id));
      const finalNotifiedIds = updatedNotifiedIds.filter(id => !activeFollowUpIds.has(id));

      if (hasChanges || finalNotifiedIds.length !== updatedNotifiedIds.length) {
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify(finalNotifiedIds));
      }
    };
    
    const intervalId = setInterval(checkFollowUps, 60 * 1000); 
    const initialCheckTimeout = setTimeout(checkFollowUps, 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialCheckTimeout);
    };
  }, [clients, t, updateClient]);

  const handleSelectClient = useCallback((id: string) => {
    setSelectedClientId(id);
  }, []);
  
  const handleOpenForm = (client: Client | null = null) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const handleOpenMultiClientForm = () => setIsMultiClientFormOpen(true);
  const handleCloseMultiClientForm = () => setIsMultiClientFormOpen(false);

  const handleOpenCameraScanner = () => {
    setScanMode('card');
    setIsScannerOpen(true);
  };

  const handleOpenQrScanner = () => {
    setScanMode('qr');
    setIsScannerOpen(true);
  };
  
  const handleSaveClient = (clientData: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType'> | Client) => {
    if ('id' in clientData) {
      updateClient(clientData.id, clientData);
    } else {
      addClient(clientData);
    }
    handleCloseForm();
  };

  const handleScanComplete = (data: Partial<Omit<Client, 'id'>>) => {
      setEditingClient(data as Client); 
      setIsFormOpen(true);
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm(t('alerts.confirmDelete'))) {
        deleteClient(id);
    }
  };

  const handleGenerateBudget = (clientId: string) => {
    setInitialBudgetInfo({ clientId, tab: 'new' });
    setCurrentView('budgets');
  };
  
  const handleSetCurrentView = (view: 'followUps' | 'clients' | 'budgets' | 'corporate' | 'tasks' | 'performance') => {
    // Always close any active chat before switching views.
    setChattingClient(null);
    setSelectedLeadId(null);
    
    if (view !== 'budgets') {
        setInitialBudgetInfo(null);
    }
    setCurrentView(view);
    setSelectedClientId(null);
  };
  
  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setChattingClient(null);
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.unreadCount > 0) {
      updateLead(leadId, { unreadCount: 0 });
    }
  };

  const handleGenerateBudgetForLead = (lead: Lead) => {
    setInitialBudgetInfo({ tab: 'new', leadName: lead.name });
    setCurrentView('budgets');
  };

  const handleSaveBudgetForLead = (budgetData: Omit<Budget, 'id'>, lead: Lead) => {
    setPendingBudgetForLead({ budget: budgetData, lead });
    setIsConfirmBudgetModalOpen(true);
  };

  const handleConfirmBudgetAction = (action: 'send' | 'save' | 'cancel') => {
    if ((action === 'send' || action === 'save') && pendingBudgetForLead) {
        // Here you would implement the logic to save the budget.
        // For now, we'll just show an alert.
        alert(t(action === 'send' ? 'budget.sentAndSaved' : 'budgets.saved'));
        console.log(`Budget for lead ${pendingBudgetForLead.lead.name} saved. Action: ${action}`, pendingBudgetForLead.budget);
    }
    setIsConfirmBudgetModalOpen(false);
    setPendingBudgetForLead(null);
    setCurrentView('corporate');
  };

  const handleUpdateLeadName = (leadId: string, newName: string) => {
    updateLead(leadId, { name: newName });
  };

  const handleSaveLeadToContacts = (lead: Lead) => {
    const isPhoneNumber = /^[+\d\s-()]+$/.test(lead.name);

    if (isPhoneNumber) {
        setLeadToSave(lead);
        setIsEnterLeadNameModalOpen(true);
    } else {
        const newClient = addClient({
            companyName: lead.name,
            phoneNumber: '', // Assume no phone number if name is not a phone number
            countryCode: '+54',
            industry: '',
            chatStatus: lead.chatStatus || 'abierto',
            conversationStatus: lead.conversationStatus,
            language: lead.language,
        });
        setLeads(prevLeads => prevLeads.filter(l => l.id !== lead.id));
        setSelectedLeadId(null);
        setChattingClient(newClient);
        alert(t('alerts.clientSaved', { name: lead.name }));
    }
  };

  const handleConfirmSaveLead = (name: string) => {
    if (leadToSave) {
        const newClient = addClient({
            companyName: name,
            phoneNumber: leadToSave.name,
            countryCode: '+54',
            industry: '',
            chatStatus: leadToSave.chatStatus || 'abierto',
            conversationStatus: leadToSave.conversationStatus,
            language: leadToSave.language,
        });
        setLeads(prevLeads => prevLeads.filter(l => l.id !== leadToSave.id));
        setSelectedLeadId(null);
        setChattingClient(newClient);
        alert(t('alerts.clientSaved', { name }));
    }
    setIsEnterLeadNameModalOpen(false);
    setLeadToSave(null);
  };
  
  const handleOpenChat = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
        // Ensure the client is visible in the chat list (if filtered by active/archived)
        if (client.chatStatus !== 'abierto' && client.chatStatus !== 'pendiente' && client.chatStatus !== 'cerrado') {
             updateClient(clientId, { chatStatus: 'abierto' });
        }
        setCurrentView('corporate');
        setChattingClient(client);
        setSelectedLeadId(null);
    }
  };

  const handleOpenBudgetGenerator = (contact: Client | Lead) => {
    setBudgetGeneratorState({ isOpen: true, contact });
  };
  
  const handleCloseBudgetGenerator = () => {
    setBudgetGeneratorState({ isOpen: false, contact: null });
  };
  
  const handleShareBudgetInChat = (budgetData: Omit<Budget, 'id'>) => {
    setSharedBudget(budgetData);
    handleCloseBudgetGenerator();
  };

  const handleGenerateBudgetForContact = (contact: Client | Lead) => {
    handleOpenBudgetGenerator(contact);
  };

  const handleOpenTaskEditor = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleUpdateContactStatus = (id: string, status: ConversationStatus) => {
      const client = clients.find(c => c.id === id);
      if (client) {
          updateClient(id, { conversationStatus: status });
      } else {
          updateLead(id, { conversationStatus: status });
      }
  };

  const handleDeleteChat = (id: string) => {
      const client = clients.find(c => c.id === id);
      if (client) {
          updateClient(id, { quotes: [], invoices: [], chatStatus: 'archivado' });
      } else {
          updateLead(id, { lastMessage: '', unreadCount: 0, chatStatus: 'archivado' });
      }
      if (selectedLeadId === id) setSelectedLeadId(null);
      if (chattingClient?.id === id) setChattingClient(null);
  };

  const handleDeleteMultipleChats = (ids: string[]) => {
      ids.forEach(id => handleDeleteChat(id));
  };

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) ?? null;
  }, [clients, selectedClientId]);
  
  // Combined list for Corporate view to show clients with chats as well
  const corporateList = useMemo(() => {
      return [...leads, ...clients.filter(c => c.chatStatus && c.chatStatus !== 'archivado' || c.conversationStatus)];
  }, [leads, clients]);

  const renderGenericView = (ListComponent: React.FC<any>, listClients: Client[]) => (
     <>
        <aside className={`w-full md:w-1/3 h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${selectedClientId ? 'hidden md:flex' : 'flex'}`}>
        <ListComponent
          clients={listClients} 
          selectedClientId={selectedClientId}
          onSelectClient={handleSelectClient}
          updateClient={updateClient}
          onGenerateBudgetForClient={handleGenerateBudget}
          onOpenChat={handleOpenChat}
        />
      </aside>

      <main className={`w-full md:w-2/3 h-full overflow-y-auto ${selectedClientId ? 'flex' : 'hidden md:flex'}`}>
        {selectedClient ? (
          <ClientDetail 
            key={selectedClient.id}
            client={selectedClient} 
            updateClient={updateClient}
            onEdit={() => handleOpenForm(selectedClient)}
            onDelete={handleDeleteClient}
            onBack={() => setSelectedClientId(null)}
            deleteBudget={(budgetId) => deleteBudgetFromClient(selectedClient.id, budgetId)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500/80 dark:text-gray-400/80">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">{t('clientDetail.noClientSelected')}</h2>
              <p className="mt-2">{t('clientDetail.selectOrAdd')}</p>
            </div>
          </div>
        )}
      </main>
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 font-sans animate-app-fade-in">
      <TopNav
        currentView={currentView}
        setCurrentView={handleSetCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsPanelOpen(true)}
        notificationCount={notificationCount}
        unreadNotificationCount={notifications.filter(n => !n.isRead).length}
      />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">
        <Suspense fallback={<FullScreenLoader />}>
         {activeChatContact ? (
            budgetGeneratorState.isOpen && budgetGeneratorState.contact?.id === activeChatContact.id ? (
                // Side-by-side view for chat + budget generator
                <>
                    <div className="w-full md:w-1/2 h-full flex flex-col">
                        <ChatView
                            contact={activeChatContact}
                            tasks={tasks}
                            onOpenTaskEditor={handleOpenTaskEditor}
                            onBack={() => { setChattingClient(null); setSelectedLeadId(null); }}
                            onGenerateBudget={handleOpenBudgetGenerator}
                            onUpdateLeadName={handleUpdateLeadName}
                            onSaveToContacts={handleSaveLeadToContacts}
                            sharedBudget={sharedBudget}
                            onClearSharedBudget={() => setSharedBudget(null)}
                            onAddTask={(contact) => {
                                setTaskOrigin({ originType: 'chat', originId: contact.id, originName: 'name' in contact ? contact.name : contact.companyName });
                                setIsTaskFormOpen(true);
                            }}
                            updateTask={updateTask}
                            deleteTask={deleteTask}
                            onUpdateStatus={handleUpdateContactStatus}
                            onQuickAddTask={addTask}
                        />
                    </div>
                    {/* Desktop side panel */}
                    <div className="hidden md:flex md:w-1/2 h-full flex-col border-l border-gray-200 dark:border-gray-700">
                        <BudgetsPage clients={clients} onSaveBudget={addBudgetToClient} onSaveBudgetForLead={handleSaveBudgetForLead} addClient={addClient} initialBudgetInfo={initialBudgetInfo} isForChat onOnChatClose={handleCloseBudgetGenerator} onShareBudgetInChat={handleShareBudgetInChat} />
                    </div>
                    {/* Mobile slide-up panel */}
                    <BudgetGeneratorPanel isOpen={budgetGeneratorState.isOpen} onClose={handleCloseBudgetGenerator}>
                        <BudgetsPage clients={clients} onSaveBudget={addBudgetToClient} onSaveBudgetForLead={handleSaveBudgetForLead} addClient={addClient} initialBudgetInfo={initialBudgetInfo} isForChat onOnChatClose={handleCloseBudgetGenerator} onShareBudgetInChat={handleShareBudgetInChat} />
                    </BudgetGeneratorPanel>
                </>
            ) : (
                // Full-width chat view
                 <ChatView
                    contact={activeChatContact}
                    tasks={tasks}
                    onOpenTaskEditor={handleOpenTaskEditor}
                    onBack={() => { setChattingClient(null); setSelectedLeadId(null); }}
                    onGenerateBudget={handleOpenBudgetGenerator}
                    onUpdateLeadName={handleUpdateLeadName}
                    onSaveToContacts={handleSaveLeadToContacts}
                    sharedBudget={sharedBudget}
                    onClearSharedBudget={() => setSharedBudget(null)}
                     onAddTask={(contact) => {
                        setTaskOrigin({ originType: 'chat', originId: contact.id, originName: 'name' in contact ? contact.name : contact.companyName });
                        setIsTaskFormOpen(true);
                    }}
                    updateTask={updateTask}
                    deleteTask={deleteTask}
                    onUpdateStatus={handleUpdateContactStatus}
                    onQuickAddTask={addTask}
                />
            )
        ) : (
             <>
                {currentView === 'followUps' && renderGenericView(FollowUpPage, clients.filter(c => c.nextFollowUpDate))}
                {currentView === 'clients' && renderGenericView(ClientList, clients)}
                {currentView === 'tasks' && <TasksPage tasks={tasks} onNewTask={() => setIsTaskFormOpen(true)} onUpdateTask={updateTask} onDeleteTask={deleteTask} onDeleteMultipleTasks={deleteMultipleTasks} onRescheduleTask={handleOpenTaskEditor} onNavigateToChat={(chatId) => { const contact = clients.find(c => c.id === chatId) || leads.find(l => l.id === chatId); if(contact) { if('lastMessage' in contact) { handleSelectLead(contact.id); } else { handleOpenChat(contact.id); } } }} />}
                {currentView === 'budgets' && <BudgetsPage clients={clients} onSaveBudget={addBudgetToClient} onSaveBudgetForLead={handleSaveBudgetForLead} addClient={addClient} initialBudgetInfo={initialBudgetInfo} />}
                {currentView === 'corporate' && <CorporateLeadsPage leads={corporateList} onSelectLead={(id) => {
                    const client = clients.find(c => c.id === id);
                    if (client) {
                        setChattingClient(client);
                    } else {
                        handleSelectLead(id);
                    }
                }} onDeleteChat={handleDeleteChat} onDeleteMultipleChats={handleDeleteMultipleChats} />}
                {currentView === 'performance' && <PerformancePage tasks={tasks} clients={clients} leads={leads} />}
            </>
        )}
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <Chatbot 
          clients={clients} 
          addClient={addClient} 
          currentView={currentView}
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen} 
        />

        {isFormOpen && (
          <ClientForm 
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            onSave={handleSaveClient}
            client={editingClient}
          />
        )}

        {isMultiClientFormOpen && (
          <MultiClientForm
            isOpen={isMultiClientFormOpen}
            onClose={handleCloseMultiClientForm}
            clients={clients}
            addClient={addClient}
            updateClient={updateClient}
          />
        )}

        {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
        
        {isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />}
        
        {isHostPanelOpen && <HostManagementPanel isOpen={isHostPanelOpen} onClose={() => setIsHostPanelOpen(false)} />}

        {isScannerOpen && (
            <CameraScanner 
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanComplete={handleScanComplete}
                scanMode={scanMode}
            />
        )}
      </Suspense>

      {showFloatingButtons && (
        <>
            <MobileAddActions
                isOpen={isAddMenuOpen}
                onClose={() => setIsAddMenuOpen(false)}
                onOpenForm={() => handleOpenForm()}
                onOpenMultiForm={handleOpenMultiClientForm}
                onOpenCameraScanner={handleOpenCameraScanner}
                onOpenQrScanner={handleOpenQrScanner}
                onTriggerExcelImport={() => excelInputRef.current?.click()}
                onTriggerDriveImport={() => driveInputRef.current?.click()}
            />
            <DesktopFloatingActions
                onOpenForm={() => handleOpenForm()}
                onOpenMultiForm={handleOpenMultiClientForm}
                onOpenCameraScanner={handleOpenCameraScanner}
                onOpenQrScanner={handleOpenQrScanner}
                onTriggerExcelImport={() => excelInputRef.current?.click()}
                onTriggerDriveImport={() => driveInputRef.current?.click()}
                onOpenAgenda={() => handleSetCurrentView('clients')}
                onOpenHostPanel={() => setIsHostPanelOpen(true)}
                isChatOpen={isChatOpen}
                onToggleChat={() => {
                setIsChatOpen(!isChatOpen);
                if (isChatOpen) window.speechSynthesis.cancel();
                }}
            />
            <BottomNav
                onOpenAgenda={() => handleSetCurrentView('clients')}
                onOpenAddMenu={() => setIsAddMenuOpen(true)}
                isChatOpen={isChatOpen}
                onToggleChat={() => {
                    setIsChatOpen(!isChatOpen);
                    if (isChatOpen) window.speechSynthesis.cancel();
                }}
            />
        </>
      )}
      
      <div className="hidden">
        <ExcelImporter onImport={importClients} inputRef={excelInputRef} />
        <GoogleDriveImporter onImport={importClients} inputRef={driveInputRef} />
      </div>

       <Suspense fallback={null}>
        {isConfirmBudgetModalOpen && (
            <SendBudgetConfirmModal
                isOpen={isConfirmBudgetModalOpen}
                onClose={() => setIsConfirmBudgetModalOpen(false)}
                leadName={pendingBudgetForLead?.lead.name || ''}
                onConfirm={handleConfirmBudgetAction}
            />
        )}

        {isEnterLeadNameModalOpen && (
            <EnterLeadNameModal 
                isOpen={isEnterLeadNameModalOpen}
                onClose={() => {
                    setIsEnterLeadNameModalOpen(false);
                    setLeadToSave(null);
                }}
                onSave={handleConfirmSaveLead}
                leadPhoneNumber={leadToSave?.name || ''}
            />
        )}

        {isTaskFormOpen && (
            <TaskFormModal
                isOpen={isTaskFormOpen}
                onClose={() => { setIsTaskFormOpen(false); setEditingTask(null); setTaskOrigin(undefined); }}
                onSave={(taskData) => {
                    if ('id' in taskData) {
                        updateTask(taskData.id, taskData);
                    } else {
                        addTask(taskData);
                    }
                    setIsTaskFormOpen(false);
                    setEditingTask(null);
                    setTaskOrigin(undefined);
                }}
                task={editingTask}
                origin={taskOrigin}
            />
        )}
        
        {isNotificationsPanelOpen && (
            <NotificationsPanel
                isOpen={isNotificationsPanelOpen}
                onClose={() => setIsNotificationsPanelOpen(false)}
                notifications={notifications}
                onNotificationClick={(notif) => {
                    // Handle navigation
                    window.history.pushState({}, '', notif.link);
                    // For simplicity, reload to handle navigation logic, or implement client-side router
                    window.location.reload();
                    setIsNotificationsPanelOpen(false);
                }}
                onClearAll={() => {
                    // Here you would clear from a persistent notification store
                    setNotifications([]);
                }}
            />
        )}
      </Suspense>
    </div>
  );
};

export default App;