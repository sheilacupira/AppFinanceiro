import { Transaction, MonthSummary, Recurrence } from '@/types/finance';
import { loadData, addTransaction, updateTransaction } from './storage';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '');
  const amount = parseInt(numbers || '0', 10) / 100;
  return formatCurrency(amount);
}

export function parseCurrencyInput(value: string): number {
  const numbers = value.replace(/\D/g, '');
  return parseInt(numbers || '0', 10) / 100;
}

export function getMonthTransactions(month: number, year: number): Transaction[] {
  const data = loadData();
  return data.transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
}

export function getMonthSummary(month: number, year: number): MonthSummary {
  const transactions = getMonthTransactions(month, year);
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    month,
    year,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export function getYearSummaries(year: number): MonthSummary[] {
  return Array.from({ length: 12 }, (_, i) => getMonthSummary(i, year));
}

export function calculateTithe(month: number, year: number): number {
  const transactions = getMonthTransactions(month, year);
  const totalIncome = transactions
    .filter(t => t.type === 'income' && !t.isTithe)
    .reduce((sum, t) => sum + t.amount, 0);
  return totalIncome * 0.1;
}

export function getTitheTransaction(month: number, year: number): Transaction | undefined {
  const transactions = getMonthTransactions(month, year);
  return transactions.find(t => t.isTithe);
}

export function createOrUpdateTithe(month: number, year: number): void {
  const data = loadData();
  if (!data.settings.isTither) return;
  
  const titheAmount = calculateTithe(month, year);
  const existingTithe = getTitheTransaction(month, year);
  
  const titheDate = new Date(year, month, 1).toISOString();
  
  if (existingTithe) {
    updateTransaction({
      ...existingTithe,
      amount: titheAmount,
    });
  } else if (titheAmount > 0) {
    addTransaction({
      id: `tithe-${year}-${month}`,
      type: 'expense',
      amount: titheAmount,
      date: titheDate,
      description: 'Dízimo',
      categoryId: 'tithe',
      status: 'pending',
      isRecurring: false,
      isTithe: true,
    });
  }
}

export function generateRecurringTransactions(month: number, year: number): void {
  const data = loadData();
  const activeRecurrences = data.recurrences.filter(r => r.isActive);
  
  activeRecurrences.forEach(recurrence => {
    // Usar o ID fixo da recorrência para garantir unicidade dentro do mês
    const transactionId = `${recurrence.id}-${year}-${month}`;
    
    // Verificar se já existe uma transação com este ID exato
    const existingTransaction = data.transactions.find(
      t => t.id === transactionId
    );
    
    if (!existingTransaction) {
      // Verificar também se não existe nenhuma outra transação para esta recorrência neste mês
      const hasTransactionInMonth = data.transactions.some(
        t => t.recurrenceId === recurrence.id &&
             new Date(t.date).getMonth() === month &&
             new Date(t.date).getFullYear() === year
      );
      
      if (!hasTransactionInMonth) {
        // Usar sempre o dia 1 do mês para recorrências
        const transactionDate = new Date(year, month, 1);
        
        addTransaction({
          id: transactionId,
          type: recurrence.type,
          amount: recurrence.amount,
          date: transactionDate.toISOString(),
          description: recurrence.description,
          categoryId: recurrence.categoryId,
          source: recurrence.source,
          status: recurrence.createAsPending ? 'pending' : 'paid',
          isRecurring: true,
          recurrenceId: recurrence.id,
        });
      }
    }
  });
}

export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month];
}

export function getMonthNameShort(month: number): string {
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return months[month];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
