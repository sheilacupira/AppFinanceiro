/**
 * Open Finance Types
 * Integração com agregadores bancários (Pluggy, Belvo, etc)
 */

export type BankConnectionStatus = 'PENDING' | 'CONNECTED' | 'ERROR' | 'UPDATING' | 'LOGIN_ERROR';

export interface BankConnection {
  id: string;
  bankId: string;
  bankName: string;
  bankLogo?: string;
  status: BankConnectionStatus;
  connectedAt: number;
  lastSyncAt?: number;
  errorMessage?: string;
  accounts: BankAccount[];
}

export interface BankAccount {
  id: string;
  connectionId: string;
  accountId: string; // ID externo do banco
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD';
  name: string;
  number?: string; // últimos 4 dígitos
  balance?: number;
  currency: string;
  lastSyncAt?: number;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: number;
  description: string;
  amount: number;
  balance?: number;
  category?: string;
  type: 'DEBIT' | 'CREDIT';
}

export interface BankInstitution {
  id: string;
  name: string;
  code?: string; // código do banco (ex: 001 para Banco do Brasil)
  logo?: string;
  primaryColor?: string;
  type: 'PERSONAL_BANK' | 'BUSINESS_BANK' | 'INVESTMENT';
}

// Pluggy API Types
export interface PluggyConnectToken {
  accessToken: string;
}

export interface PluggyItem {
  id: string;
  status: string;
  executionStatus: string;
  connector: {
    id: number;
    name: string;
    imageUrl?: string;
    primaryColor?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt?: string;
}

export interface PluggyAccount {
  id: string;
  itemId: string;
  type: string;
  subtype: string;
  name: string;
  number?: string;
  balance: number;
  currencyCode: string;
  creditData?: {
    level: string;
    brand: string;
    balanceCloseDate: string;
    balanceDueDate: string;
    availableCreditLimit: number;
    balanceForeignCurrency: number;
    minimumPayment: number;
    creditLimit: number;
  };
}

export interface PluggyTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  descriptionRaw?: string;
  amount: number;
  balance?: number;
  currencyCode: string;
  category?: string;
  providerCode?: string;
  status: string;
  type: 'DEBIT' | 'CREDIT';
}

export interface OpenFinanceConfig {
  provider: 'pluggy' | 'belvo' | 'manual';
  clientId?: string;
  clientSecret?: string;
  // Pluggy usa Client ID e Secret
  // Belvo usa Secret Key ID e Secret Key
}
