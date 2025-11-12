

import { Client } from '../types';

type ParsedClientData = Omit<Client, 'id' | 'rating' | 'followUps' | 'quotes' | 'invoices' | 'notes' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft'>;

const generateDefaultName = (phone: string) => `Client ${phone.slice(-4)}`;

const parseLine = (line: string): ParsedClientData | null => {
    if (!line.trim()) return null;

    // Split by comma, then tab. Fallback to multiple spaces.
    const parts = line.split(',').length > 1 ? line.split(',') : (line.split('\t').length > 1 ? line.split('\t') : line.split(/\s{2,}/));
    const trimmedParts = parts.map(p => p.trim()).filter(p => p);

    if (trimmedParts.length === 0) return null;

    let companyName = '';
    let phoneNumber = '';
    let industry = '';
    
    // Logic to assign parts to fields
    if (trimmedParts.length === 1) {
      if (/\d{7,}/.test(trimmedParts[0])) { // Looks like a phone number
        phoneNumber = trimmedParts[0];
        companyName = generateDefaultName(phoneNumber);
      } else { // Looks like a company name
        companyName = trimmedParts[0];
      }
    } else if (trimmedParts.length === 2) {
      // Check which one is the phone number
      if (/\d{7,}/.test(trimmedParts[1])) {
        companyName = trimmedParts[0];
        phoneNumber = trimmedParts[1];
      } else if (/\d{7,}/.test(trimmedParts[0])) {
         companyName = trimmedParts[1];
         phoneNumber = trimmedParts[0];
      } else {
        // Assume name, phone
        companyName = trimmedParts[0];
        phoneNumber = trimmedParts[1];
      }
    } else { // 3 or more
      companyName = trimmedParts[0];
      phoneNumber = trimmedParts[1];
      industry = trimmedParts[2];
    }
    
    if (companyName || phoneNumber) {
        return { companyName, phoneNumber, industry, countryCode: '+54', status: 'active', budgets: [], clientType: null };
    }
    return null;
}


export const parsePastedText = (text: string): ParsedClientData[] => {
  if (!text.trim()) return [];
  return text.trim().split(/\r?\n/).map(parseLine).filter((c): c is ParsedClientData => c !== null);
};

export const parseTextFile = (text: string): ParsedClientData[] => {
    // For CSV/TXT files, we assume a structured format: Company,Phone,Industry
    return parsePastedText(text); // The logic can be the same for now
};