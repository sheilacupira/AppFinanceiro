import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { loadSampleData, hasSampleData } from '@/lib/sampleData';

interface FinanceContextType {
  data: AppData;
  refreshData: () => void;
  
  // Transactions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  
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
    if (data.settings.isTither && transaction.type === 'income') {
      const txDate = new Date(transaction.date);
      createOrUpdateTithe(txDate.getMonth(), txDate.getFullYear());
    }
    refreshData();
  }, [data.settings.isTither, refreshData]);

  const handleUpdateTransaction = useCallback((transaction: Transaction) => {
    updateTx(transaction);
    if (data.settings.isTither && transaction.type === 'income') {
      const txDate = new Date(transaction.date);
      createOrUpdateTithe(txDate.getMonth(), txDate.getFullYear());
    }
    refreshData();
  }, [data.settings.isTither, refreshData]);

  const handleDeleteTransaction = useCallback((id: string) => {
    const tx = data.transactions.find(t => t.id === id);
    deleteTx(id);
    if (data.settings.isTither && tx?.type === 'income') {
      const txDate = new Date(tx.date);
      createOrUpdateTithe(txDate.getMonth(), txDate.getFullYear());
    }
    refreshData();
  }, [data.transactions, data.settings.isTither, refreshData]);

  const handleAddRecurrence = useCallback((recurrence: Recurrence) => {
    addRec(recurrence);
    refreshData();
  }, [refreshData]);

  const handleUpdateRecurrence = useCallback((recurrence: Recurrence) => {
    updateRec(recurrence);
    refreshData();
  }, [refreshData]);

  const handleDeleteRecurrence = useCallback((id: string) => {
    deleteRec(id);
    refreshData();
  }, [refreshData]);

  const handleAddCategory = useCallback((category: Category) => {
    addCat(category);
    refreshData();
  }, [refreshData]);

  const handleUpdateCategory = useCallback((category: Category) => {
    updateCat(category);
    refreshData();
  }, [refreshData]);

  const handleDeleteCategory = useCallback((id: string) => {
    const success = deleteCat(id);
    if (success) refreshData();
    return success;
  }, [refreshData]);

  const handleUpdateSettings = useCallback((settings: Partial<Settings>) => {
    updateSet(settings);
    refreshData();
  }, [refreshData]);

  return (
    <FinanceContext.Provider
      value={{
        data,
        refreshData,
        addTransaction: handleAddTransaction,
        updateTransaction: handleUpdateTransaction,
        deleteTransaction: handleDeleteTransaction,
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
