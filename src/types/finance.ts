export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';
export type RecurrenceFrequency = 'monthly';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO date string
  description: string;
  categoryId: string;
  source?: string;
  status: TransactionStatus;
  isRecurring: boolean;
  recurrenceId?: string;
  isTithe?: boolean;
  importBatchId?: string; // Tracks which import batch this came from
}

export interface Recurrence {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  source?: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  isActive: boolean;
  createAsPending: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'both';
  icon?: string;
}

export interface Settings {
  isTither: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface AppData {
  schemaVersion: number;
  transactions: Transaction[];
  recurrences: Recurrence[];
  categories: Category[];
  settings: Settings;
}

export interface MonthSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
