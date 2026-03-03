import { AppData, Transaction, Recurrence, Category, Settings } from '@/types/finance';

const STORAGE_KEY_PREFIX = 'financeiro_data';
const CURRENT_SCHEMA_VERSION = 1;

let currentTenantId: string | undefined = undefined;

export function setCurrentTenantId(tenantId: string | undefined): void {
  currentTenantId = tenantId;
}

export function getCurrentTenantId(): string | undefined {
  return currentTenantId;
}

function getStorageKey(): string {
  if (!currentTenantId) {
    return STORAGE_KEY_PREFIX;
  }
  return `${STORAGE_KEY_PREFIX}:${currentTenantId}`;
}

const defaultCategories: Category[] = [
  { id: 'salary', name: 'Salário', type: 'income', icon: '💼' },
  { id: 'freelance', name: 'Freelance', type: 'income', icon: '💻' },
  { id: 'investment', name: 'Investimentos', type: 'income', icon: '📈' },
  { id: 'other-income', name: 'Outros (Entrada)', type: 'income', icon: '💰' },
  { id: 'tithe', name: 'Dízimo', type: 'expense', icon: '⛪' },
  { id: 'housing', name: 'Moradia', type: 'expense', icon: '🏠' },
  { id: 'food', name: 'Alimentação', type: 'expense', icon: '🍽️' },
  { id: 'transport', name: 'Transporte', type: 'expense', icon: '🚗' },
  { id: 'health', name: 'Saúde', type: 'expense', icon: '🏥' },
  { id: 'education', name: 'Educação', type: 'expense', icon: '📚' },
  { id: 'entertainment', name: 'Lazer', type: 'expense', icon: '🎬' },
  { id: 'shopping', name: 'Compras', type: 'expense', icon: '🛍️' },
  { id: 'bills', name: 'Contas', type: 'expense', icon: '📄' },
  { id: 'consortium', name: 'Consórcio', type: 'expense', icon: '🏦' },
  { id: 'other-expense', name: 'Outros (Saída)', type: 'expense', icon: '💸' },
];

const defaultSettings: Settings = {
  isTither: false,
  theme: 'system',
};

export function getDefaultData(): AppData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    transactions: [],
    recurrences: [],
    categories: defaultCategories,
    settings: defaultSettings,
  };
}

export function loadData(): AppData {
  try {
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    if (!stored) {
      const defaultData = getDefaultData();
      saveData(defaultData);
      return defaultData;
    }
    const data = JSON.parse(stored) as AppData;
    // Migration logic can go here if schema changes
    return data;
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: AppData): void {
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(data));
}

export function exportData(): string {
  const data = loadData();
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string, merge: boolean = false): AppData {
  const importedData = JSON.parse(jsonString) as AppData;
  
  if (merge) {
    const currentData = loadData();
    const mergedData: AppData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      transactions: [
        ...currentData.transactions,
        ...importedData.transactions.filter(
          t => !currentData.transactions.some(ct => ct.id === t.id)
        ),
      ],
      recurrences: [
        ...currentData.recurrences,
        ...importedData.recurrences.filter(
          r => !currentData.recurrences.some(cr => cr.id === r.id)
        ),
      ],
      categories: [
        ...currentData.categories,
        ...importedData.categories.filter(
          c => !currentData.categories.some(cc => cc.id === c.id)
        ),
      ],
      settings: currentData.settings,
    };
    saveData(mergedData);
    return mergedData;
  } else {
    saveData(importedData);
    return importedData;
  }
}

// Transaction helpers
export function addTransaction(transaction: Transaction): void {
  const data = loadData();
  
  // Verificar se já existe uma transação com o mesmo ID
  const isDuplicate = data.transactions.some(t => t.id === transaction.id);
  
  if (!isDuplicate) {
    data.transactions.push(transaction);
    saveData(data);
  }
}

export function updateTransaction(transaction: Transaction): void {
  const data = loadData();
  const index = data.transactions.findIndex(t => t.id === transaction.id);
  if (index !== -1) {
    data.transactions[index] = transaction;
    saveData(data);
  }
}

export function deleteTransaction(id: string): void {
  const data = loadData();
  data.transactions = data.transactions.filter(t => t.id !== id);
  saveData(data);
}

// Recurrence helpers
export function addRecurrence(recurrence: Recurrence): void {
  const data = loadData();
  data.recurrences.push(recurrence);
  saveData(data);
}

export function updateRecurrence(recurrence: Recurrence): void {
  const data = loadData();
  const index = data.recurrences.findIndex(r => r.id === recurrence.id);
  if (index !== -1) {
    data.recurrences[index] = recurrence;
    saveData(data);
  }
}

export function deleteRecurrence(id: string): void {
  const data = loadData();
  data.recurrences = data.recurrences.filter(r => r.id !== id);
  saveData(data);
}

// Category helpers
export function addCategory(category: Category): void {
  const data = loadData();
  data.categories.push(category);
  saveData(data);
}

export function updateCategory(category: Category): void {
  const data = loadData();
  const index = data.categories.findIndex(c => c.id === category.id);
  if (index !== -1) {
    data.categories[index] = category;
    saveData(data);
  }
}

export function deleteCategory(id: string): boolean {
  const data = loadData();
  const isInUse = data.transactions.some(t => t.categoryId === id)
    || data.recurrences.some(r => r.categoryId === id);
  if (isInUse) {
    return false;
  }
  data.categories = data.categories.filter(c => c.id !== id);
  saveData(data);
  return true;
}

// Settings helpers
export function updateSettings(settings: Partial<Settings>): void {
  const data = loadData();
  data.settings = { ...data.settings, ...settings };
  saveData(data);
}

export function getSettings(): Settings {
  return loadData().settings;
}
