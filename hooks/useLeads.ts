import { useState, useEffect, useCallback } from 'react';
import { Lead } from '../types';

const LEADS_STORAGE_KEY = 'crm_leads';

const getLeadsFromStorage = (): Lead[] => {
  try {
    const item = window.localStorage.getItem(LEADS_STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('Error reading leads from localStorage', error);
    return [];
  }
};

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>(getLeadsFromStorage);

  useEffect(() => {
    try {
      window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    } catch (error) {
      console.error('Error writing leads to localStorage', error);
    }
  }, [leads]);

  const updateLead = useCallback((id: string, updatedData: Partial<Omit<Lead, 'id'>>) => {
    setLeads(prev =>
      prev.map(lead =>
        lead.id === id ? { ...lead, ...updatedData } : lead
      )
    );
  }, []);
  
  const addLead = useCallback((leadData: Omit<Lead, 'id'>) => {
     const newLead: Lead = { ...leadData, id: `lead-${crypto.randomUUID()}` };
     setLeads(prev => [newLead, ...prev]);
     return newLead;
  }, []);

  const initializeLeads = useCallback(() => {
    if (getLeadsFromStorage().length === 0) {
        const mockLeads: Lead[] = [
            { id: 'lead-1', name: 'Prospect One', lastMessage: 'Hello, I would like a quote for product X.', timestamp: new Date(Date.now() - 3600000).toISOString(), unreadCount: 2, language: 'en', conversationStatus: 'En seguimiento', photoUrl: 'https://i.pravatar.cc/48?u=lead-1' },
            { id: 'lead-2', name: '555-123-4567', lastMessage: 'Is this available in blue?', timestamp: new Date(Date.now() - 86400000).toISOString(), unreadCount: 0, language: 'en', conversationStatus: 'Sin contacto', photoUrl: 'https://i.pravatar.cc/48?u=lead-2' },
        ];
        setLeads(mockLeads);
    }
  }, []);

  return { leads, setLeads, updateLead, addLead, initializeLeads };
};