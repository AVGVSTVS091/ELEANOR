import { useState, useEffect, useCallback } from 'react';
import { Client, Budget, Note, FollowUp, FileRecord } from '../types';
import { useSettings } from './useSettings';

const getStorageKey = (mode: 'individual' | 'host' | 'client'): string => {
  return mode === 'individual' ? 'crm_clients_individual' : 'crm_clients_host';
}

const getClientsFromStorage = (key: string): Client[] => {
  try {
    const item = window.localStorage.getItem(key);
    const clients = item ? JSON.parse(item) : [];
    // Backwards compatibility for clients stored before new fields were added
    return clients.map((c: any) => {
      let clientType = c.clientType || null;
      const migrationMap: Record<string, Client['clientType']> = {
        'A': 'Dist',
        'B': 'Emp',
        'C': 'CF',
        'D': 'Cos',
      };
      const validTypes: (Client['clientType'])[] = ['Dist', 'Emp', 'CF', 'Cos', 'Otro', null];

      if (clientType && migrationMap[clientType]) {
        clientType = migrationMap[clientType];
      } else if (!validTypes.includes(clientType)) {
        clientType = null;
      }
      
      return {
       ...c,
       companyName: c.companyName || '',
       phoneNumber: c.phoneNumber || '',
       industry: c.industry || '',
       rating: typeof c.rating === 'number' ? c.rating : 0,
       followUps: Array.isArray(c.followUps) ? c.followUps : [],
       quotes: Array.isArray(c.quotes) ? c.quotes : [],
       invoices: Array.isArray(c.invoices) ? c.invoices : [],
       notes: Array.isArray(c.notes) && c.notes.length > 0 ? c.notes : [{ id: crypto.randomUUID(), content: '', lastUpdated: new Date().toISOString() }],
       countryCode: c.countryCode || '+54',
       whatsAppStatus: c.whatsAppStatus || 'unknown',
       nextFollowUpDate: c.nextFollowUpDate || null,
       isPaused: c.isPaused || false,
       pausedTimeLeft: c.pausedTimeLeft || null,
       status: c.status || 'active',
       budgets: Array.isArray(c.budgets) ? c.budgets : [],
       clientType: clientType,
      };
    });
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return [];
  }
}

export const useClients = () => {
  const { settings, isNewHostSession, setIsNewHostSession } = useSettings();
  const [storageKey, setStorageKey] = useState(getStorageKey(settings.mode));

  useEffect(() => {
    const newKey = getStorageKey(settings.mode);
    // Move individual clients to host storage when starting a new host session
    if (isNewHostSession) {
        const individualClients = getClientsFromStorage(getStorageKey('individual'));
        window.localStorage.setItem(newKey, JSON.stringify(individualClients));
        setClients(individualClients);
        // Reset the flag
        setIsNewHostSession(false);
    }
    setStorageKey(newKey);
  }, [settings.mode, isNewHostSession, setIsNewHostSession]);

  const [clients, setClients] = useState<Client[]>(() => getClientsFromStorage(storageKey));
  
  useEffect(() => {
    setClients(getClientsFromStorage(storageKey));
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(clients));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [clients, storageKey]);


  const addClient = useCallback((clientData: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType' | 'rating' | 'followUps' | 'quotes' | 'invoices' | 'notes'> & Partial<Pick<Client, 'rating' | 'followUps' | 'quotes' | 'invoices' | 'notes'>>) => {
    const newClient: Client = {
      ...clientData,
      id: crypto.randomUUID(),
      rating: clientData.rating || 0,
      followUps: clientData.followUps || [],
      quotes: clientData.quotes || [],
      invoices: clientData.invoices || [],
      notes: clientData.notes || [{ id: crypto.randomUUID(), content: '', lastUpdated: new Date().toISOString() }],
      whatsAppStatus: 'unknown',
      nextFollowUpDate: null,
      isPaused: false,
      pausedTimeLeft: null,
      status: 'active',
      budgets: [],
      clientType: null,
      photoUrl: undefined,
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, updatedData: Partial<Omit<Client, 'id'>>) => {
    setClients(prev =>
      prev.map(client =>
        client.id === id ? { ...client, ...updatedData } : client
      )
    );
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  }, []);

  const importClients = useCallback((importedClients: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType'>[]) => {
    setClients(prevClients => {
      const existingPhones = new Set(prevClients.map(c => c.countryCode + c.phoneNumber));
      const newClients = importedClients
        .filter(ic => !existingPhones.has(ic.countryCode + ic.phoneNumber))
        .map(ic => ({
            ...ic,
            id: crypto.randomUUID(),
            rating: 0,
            followUps: [],
            quotes: [],
            invoices: [],
            notes: [{ id: crypto.randomUUID(), content: '', lastUpdated: new Date().toISOString() }],
            whatsAppStatus: 'unknown' as const,
            nextFollowUpDate: null,
            isPaused: false,
            pausedTimeLeft: null,
            status: 'active' as const,
            budgets: [],
            clientType: null,
        }));
      return [...prevClients, ...newClients];
    });
  }, []);

  const addBudgetToClient = useCallback((clientId: string, budgetData: Omit<Budget, 'id'>) => {
      const newBudget: Budget = {
          ...budgetData,
          id: `budget-${crypto.randomUUID()}`
      };
      setClients(prev => prev.map(client => {
          if (client.id === clientId) {
              return {
                  ...client,
                  budgets: [...client.budgets, newBudget]
              }
          }
          return client;
      }));
  }, []);

  const deleteBudgetFromClient = useCallback((clientId: string, budgetId: string) => {
      setClients(prev => prev.map(client => {
          if (client.id === clientId) {
              return {
                  ...client,
                  budgets: client.budgets.filter(b => b.id !== budgetId)
              }
          }
          return client;
      }));
  }, []);


  return { clients, addClient, updateClient, deleteClient, importClients, addBudgetToClient, deleteBudgetFromClient };
};