import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isSaasMode } from '@/config/runtime';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction, Recurrence, Category, Settings, AppData } from '@/types/finance';
import { 
  loadData, 
  saveData, 
  addTransaction as addTx, 
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
  addRecurrence as addRec,
  updateRecurrence as updateRec,
  deleteRecurrence as deleteRec,
  addCategory as addCat,
  updateCategory as updateCat,
  deleteCategory as deleteCat,
  updateSettings as updateSet,
} from '@/lib/storage';
import { createOrUpdateTithe, generateRecurringTransactions } from '@/lib/finance';
import { loadSaasTokens } from '@/lib/saasAuthStorage';
import {
  deleteRemoteCategory,
  deleteRemoteRecurrence,
  syncFinanceMeta,
  upsertRemoteCategory,
  upsertRemoteRecurrence,
  upsertRemoteSettings,
} from '@/lib/financeMetaSync';
import { enqueueSyncOperation, processSyncQueue } from '@/lib/syncQueue';
import { deleteRemoteTransaction, syncTransactions, upsertRemoteTransaction } from '@/lib/transactionSync';
import { loadSampleData, hasSampleData } from '@/lib/sampleData';

interface FinanceContextType {
  data: AppData;
  refreshData: () => void;
  
  // Transactions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  deleteImportBatch: (batchId: string) => void;
  
  // Recurrences
  addRecurrence: (recurrence: Recurrence) => void;
  updateRecurrence: (recurrence: Recurrence) => void;
  deleteRecurrence: (id: string) => void;
  
  // Categories
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => boolean;
  
  // Settings
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Month navigation
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { status, session } = useAuth();
  const tenantId = session?.tenant.id;
  const [data, setData] = useState<AppData>(() => loadData());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [lastProcessedMonth, setLastProcessedMonth] = useState<string>(`${new Date().getFullYear()}-${new Date().getMonth()}`);

  useEffect(() => {
    // Dados de amostra desabilitados - começar vazio
    // if (!hasSampleData()) {
    //   loadSampleData();
    //   setData(loadData());
    // }
  }, []);

  useEffect(() => {
    const monthKey = `${currentYear}-${currentMonth}`;
    
    // Só processar se o mês mudou
    if (monthKey !== lastProcessedMonth) {
      generateRecurringTransactions(currentMonth, currentYear);
      if (data.settings.isTither) {
        createOrUpdateTithe(currentMonth, currentYear);
      }
      setData(loadData());
      setLastProcessedMonth(monthKey);
    }
  }, [currentMonth, currentYear, data.settings.isTither, lastProcessedMonth]);

  const refreshData = useCallback(() => {
    setData(loadData());
  }, []);

  const getAccessToken = useCallback(() => {
    const tokens = loadSaasTokens();
    return tokens?.accessToken;
  }, []);

  useEffect(() => {
    if (!isSaasMode || status !== 'authenticated' || !tenantId) {
      return;
    }

    const tokens = loadSaasTokens();
    if (!tokens) {
      return;
    }

    let cancelled = false;

    const runSync = async () => {
      try {
        await processSyncQueue(tokens.accessToken);

        const localData = loadData();
        const [syncedTransactions, syncedMeta] = await Promise.all([
          syncTransactions(localData.transactions, tokens.accessToken),
          syncFinanceMeta(
            {
              recurrences: localData.recurrences,
              categories: localData.categories,
              settings: localData.settings,
            },
            tokens.accessToken
          ),
        ]);

        saveData({
          ...localData,
          transactions: syncedTransactions,
          recurrences: syncedMeta.recurrences,
          categories: syncedMeta.categories,
          settings: syncedMeta.settings ?? localData.settings,
        });

        if (!cancelled) {
          setData(loadData());
        }
      } catch (error) {
        console.error('Failed to synchronize transactions with cloud', error);
      }
    };

    void runSync();

    return () => {
      cancelled = true;
    };
  }, [status, tenantId]);

  useEffect(() => {
    if (!isSaasMode || status !== 'authenticated' || !tenantId) {
      return;
    }

    const drainQueue = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        return;
      }

      await processSyncQueue(accessToken);
    };

    void drainQueue();

    const onOnline = () => {
      void drainQueue();
    };

    const intervalId = window.setInterval(() => {
      void drainQueue();
    }, 30000);

    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.clearInterval(intervalId);
    };
  }, [getAccessToken, status, tenantId]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(y => y - 1);
      } else {
        setCurrentMonth(m => m - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(y => y + 1);
      } else {
        setCurrentMonth(m => m + 1);
      }
    }
  }, [currentMonth]);

  const handleAddTransaction = useCallback((transaction: Transaction) => {
    addTx(transaction);
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      if (accessToken) {
        void upsertRemoteTransaction(accessToken, transaction).catch((error) => {
          enqueueSyncOperation('transaction.upsert', { transaction });
          console.error('Failed to upsert remote transaction', error);
        });
      } else {
        enqueueSyncOperation('transaction.upsert', { transaction });
      }
    }
    if (data.settings.isTither && transaction.type === 'income') {
      const txDate = new Date(transaction.date);
      createOrUpdateTithe(txDate.getMonth(), txDate.getFullYear());
    }
    refreshData();
  }, [data.settings.isTither, getAccessToken, refreshData, status]);

  const handleUpdateTransaction = useCallback((transaction: Transaction) => {
    updateTx(transaction);
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      if (accessToken) {
        void upsertRemoteTransaction(accessToken, transaction).catch((error) => {
          enqueueSyncOperation('transaction.upsert', { transaction });
          console.error('Failed to update remote transaction', error);
        });
      } else {
        enqueueSyncOperation('transaction.upsert', { transaction });
      }
    }
    if (data.settings.isTither && transaction.type === 'income') {
      const txDate = new Date(transaction.date);
      createOrUpdateTithe(txDate.getMonth(), txDate.getFullYear());
    }
    refreshData();
  }, [data.settings.isTither, getAccessToken, refreshData, status]);

  const handleDeleteTransaction = useCallback((id: string) => {
    const tx = data.transactions.find(t => t.id === id);
    deleteTx(id);
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      if (accessToken) {
        void deleteRemoteTransaction(accessToken, id).catch((error) => {
          enqueueSyncOperation('transaction.delete', { transactionId: id });
          console.error('Failed to delete remote transaction', error);
        });
      } else {
        enqueueSyncOperation('transaction.delete', { transactionId: id });
      }
    }
    if (data.settings.isTither && tx?.type === 'income') {
      const txDate = new Date(tx.date);
      createOrUpdateTithe(txDate.getMonth(), txDate.getFullYear());
    }
    refreshData();
  }, [data.transactions, data.settings.isTither, getAccessToken, refreshData, status]);

  const handleDeleteImportBatch = useCallback((batchId: string) => {
    // Delete all transactions with this importBatchId from local storage
    const transactions = data.transactions.filter(t => t.importBatchId !== batchId);
    saveData({ ...data, transactions });
    
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      if (accessToken) {
        // Call backend to delete transactions by batch ID
        fetch(`http://localhost:4000/api/transactions/batch/${batchId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }).catch((error) => {
          enqueueSyncOperation('importBatch.delete', { batchId });
          console.error('Failed to delete remote import batch', error);
        });
      } else {
        enqueueSyncOperation('importBatch.delete', { batchId });
      }
    }
    
    refreshData();
  }, [data, getAccessToken, refreshData, status]);

  const handleAddRecurrence = useCallback((recurrence: Recurrence) => {
    addRec(recurrence);
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      if (accessToken) {
        void upsertRemoteRecurrence(accessToken, recurrence).catch((error) => {
          enqueueSyncOperation('recurrence.upsert', { recurrence });
          console.error('Failed to add remote recurrence', error);
        });
      } else {
        enqueueSyncOperation('recurrence.upsert', { recurrence });
      }
    }
    refreshData();
  }, [getAccessToken, refreshData, status]);

  const handleUpdateRecurrence = useCallback((recurrence: Recurrence) => {
    updateRec(recurrence);
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      if (accessToken) {
        void upsertRemoteRecurrence(accessToken, recurrence).catch((error) => {
          enqueueSyncOperation('recurrence.upsert', { recurrence });
          console.error('Failed to update remote recurrence', error);
        });
      } else {
        enqueueSyncOperation('recurrence.upsert', { recurrence });
      }
    }
    refreshData();
  }, [getAccessToken, refreshData, status]);

  const handleDeleteRecurrence = useCallback((id: string) => {
    deleteRec(id);
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      if (accessToken) {
        void deleteRemoteRecurrence(accessToken, id).catch((error) => {
          enqueueSyncOperation('recurrence.delete', { recurrenceId: id });
          console.error('Failed to delete remote recurrence', error);
        });
      } else {
        enqueueSyncOperation('recurrence.delete', { recurrenceId: id });
      }
    }
    refreshData();
  }, [getAccessToken, refreshData, status]);

  const handleAddCategory = useCallback((category: Category) => {
    addCat(category);
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      if (accessToken) {
        void upsertRemoteCategory(accessToken, category).catch((error) => {
          enqueueSyncOperation('category.upsert', { category });
          console.error('Failed to add remote category', error);
        });
      } else {
        enqueueSyncOperation('category.upsert', { category });
      }
    }
    refreshData();
  }, [getAccessToken, refreshData, status]);

  const handleUpdateCategory = useCallback((category: Category) => {
    updateCat(category);
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      if (accessToken) {
        void upsertRemoteCategory(accessToken, category).catch((error) => {
          enqueueSyncOperation('category.upsert', { category });
          console.error('Failed to update remote category', error);
        });
      } else {
        enqueueSyncOperation('category.upsert', { category });
      }
    }
    refreshData();
  }, [getAccessToken, refreshData, status]);

  const handleDeleteCategory = useCallback((id: string) => {
    const success = deleteCat(id);
    if (success) {
      if (isSaasMode && status === 'authenticated') {
        const accessToken = getAccessToken();
        if (accessToken) {
          void deleteRemoteCategory(accessToken, id).catch((error) => {
            enqueueSyncOperation('category.delete', { categoryId: id });
            console.error('Failed to delete remote category', error);
          });
        } else {
          enqueueSyncOperation('category.delete', { categoryId: id });
        }
      }
      refreshData();
    }
    return success;
  }, [getAccessToken, refreshData, status]);

  const handleUpdateSettings = useCallback((settings: Partial<Settings>) => {
    updateSet(settings);
    if (isSaasMode && status === 'authenticated') {
      const accessToken = getAccessToken();
      const currentData = loadData();
      if (accessToken) {
        void upsertRemoteSettings(accessToken, currentData.settings).catch((error) => {
          enqueueSyncOperation('settings.upsert', { settings: currentData.settings });
          console.error('Failed to update remote settings', error);
        });
      } else {
        enqueueSyncOperation('settings.upsert', { settings: currentData.settings });
      }
    }
    refreshData();
  }, [getAccessToken, refreshData, status]);

  return (
    <FinanceContext.Provider
      value={{
        data,
        refreshData,
        addTransaction: handleAddTransaction,
        updateTransaction: handleUpdateTransaction,
        deleteTransaction: handleDeleteTransaction,
        deleteImportBatch: handleDeleteImportBatch,
        addRecurrence: handleAddRecurrence,
        updateRecurrence: handleUpdateRecurrence,
        deleteRecurrence: handleDeleteRecurrence,
        addCategory: handleAddCategory,
        updateCategory: handleUpdateCategory,
        deleteCategory: handleDeleteCategory,
        updateSettings: handleUpdateSettings,
        currentMonth,
        currentYear,
        setCurrentMonth,
        setCurrentYear,
        navigateMonth,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
