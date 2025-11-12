



export interface FileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 encoded content
  description: string;
  uploadDate: string; // ISO string
}

export interface FollowUp {
  id: string;
  timestamp: string; // ISO string
}

export interface Note {
  id: string;
  content: string;
  lastUpdated: string; // ISO string
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
}

export type PriceListType = 'distributor' | 'consumer' | 'company' | 'cost';

export interface PriceList {
  type: PriceListType;
  fileName: string;
  uploadDate: string;
  products: Product[];
}

export interface CustomPriceList {
  id: string;
  name: string;
  fileName: string;
  uploadDate: string;
  products: Product[];
}

export interface BudgetItem {
  product: Product;
  quantity: number;
}

export interface Budget {
  id: string;
  clientId: string;
  clientName: string;
  date: string; // ISO string
  items: BudgetItem[];
  discount: number; // Percentage
  subtotal: number;
  total: number;
}

export type ConversationStatus = 'Ninguno' | 'En seguimiento' | 'Fidelizado' | 'Sin contacto' | 'Perdido';

export interface Client {
  id: string;
  companyName: string;
  countryCode: string;
  phoneNumber: string;
  industry: string;
  rating: number; // 0-5
  followUps: FollowUp[];
  quotes: FileRecord[];
  invoices: FileRecord[];
  notes: Note[];
  whatsAppStatus: 'unknown' | 'checking' | 'available' | 'unavailable';
  nextFollowUpDate: string | null; // ISO string
  isPaused: boolean;
  pausedTimeLeft: number | null; // Time left in milliseconds when paused
  status: 'active' | 'suspended';
  budgets: Budget[];
  clientType: 'Dist' | 'Emp' | 'CF' | 'Cos' | 'Otro' | null;
  chatStatus?: 'abierto' | 'pendiente' | 'cerrado' | 'archivado';
  conversationStatus?: ConversationStatus;
  language?: string;
  photoUrl?: string;
}

export type OperatingMode = 'individual' | 'host' | 'client';

export interface ConnectedUser {
  id: string;
  name: string;
}

export interface Lead {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string; // ISO string
  unreadCount: number;
  chatStatus?: 'abierto' | 'pendiente' | 'cerrado' | 'archivado';
  conversationStatus?: ConversationStatus;
  language?: string;
  photoUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  scheduledAt: string; // ISO string
  color: string;
  originType: 'chat' | 'manual';
  originId?: string; // Client or Lead ID
  originName?: string; // Client or Lead Name for display
  createdAt: string; // ISO string
  status: 'pending' | 'completed';
  notificationId?: number;
}

export interface AppNotification {
    id: string;
    message: string;
    link: string; // URL to navigate to
    timestamp: string;
    isRead: boolean;
    relatedId: string; // e.g., taskId
}

export interface Sale {
  id: string;
  originId: string; // Client or Lead ID
  clientName: string;
  amount: number;
  date: string; // ISO string
  invoiceRef?: string;
  timestamp: string; // Created At
}

// --- App Architecture Types ---

export enum AppFolder {
  Config = 'config',
  User = 'user',
  Chat = 'chat',
  Media = 'media',
  Reports = 'reports',
  Logs = 'logs',
  Security = 'security',
  Sync = 'sync',
  Backups = 'backups'
}

export interface AppManifest {
  version: string;
  installDate: string;
  lastIntegrityCheck: string;
  folders: Record<string, string>; // Name -> Path/Hash
  checksums: Record<string, string>;
}

export enum MembershipTier {
  Lite = 'lite',
  Pro = 'pro',
  Plus = 'plus'
}

export interface LicenseToken {
  tier: MembershipTier;
  expiry: string; // ISO Date
  features: string[];
  signature: string;
}

export interface RemoteCommand {
  id: string;
  type: 'lock' | 'unlock' | 'suspend' | 'wipe' | 'config_push';
  payload?: any;
  timestamp: string;
  signature: string;
  issuedBy: string;
}