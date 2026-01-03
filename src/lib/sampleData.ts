import { Transaction, Recurrence, AppData } from '@/types/finance';
import { saveData, loadData, getDefaultData } from './storage';

export function loadSampleData(): void {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const sampleTransactions: Transaction[] = [
    // Entradas
    {
      id: 'sample-1',
      type: 'income',
      amount: 6566.16,
      date: new Date(currentYear, currentMonth, 5).toISOString(),
      description: 'Prefeitura',
      categoryId: 'salary',
      source: 'Salário mensal',
      status: 'paid',
      isRecurring: true,
      recurrenceId: 'rec-1',
    },
    {
      id: 'sample-2',
      type: 'income',
      amount: 1500.00,
      date: new Date(currentYear, currentMonth, 15).toISOString(),
      description: 'Projeto Website',
      categoryId: 'freelance',
      source: 'Cliente ABC',
      status: 'paid',
      isRecurring: false,
    },
    {
      id: 'sample-3',
      type: 'income',
      amount: 350.00,
      date: new Date(currentYear, currentMonth, 20).toISOString(),
      description: 'Dividendos',
      categoryId: 'investment',
      status: 'pending',
      isRecurring: false,
    },
    // Saídas
    {
      id: 'sample-4',
      type: 'expense',
      amount: 1000.00,
      date: new Date(currentYear, currentMonth, 10).toISOString(),
      description: 'Consórcio 28/64',
      categoryId: 'consortium',
      status: 'paid',
      isRecurring: true,
      recurrenceId: 'rec-2',
    },
    {
      id: 'sample-5',
      type: 'expense',
      amount: 1200.00,
      date: new Date(currentYear, currentMonth, 5).toISOString(),
      description: 'Aluguel',
      categoryId: 'housing',
      status: 'paid',
      isRecurring: true,
      recurrenceId: 'rec-3',
    },
    {
      id: 'sample-6',
      type: 'expense',
      amount: 450.00,
      date: new Date(currentYear, currentMonth, 8).toISOString(),
      description: 'Supermercado',
      categoryId: 'food',
      status: 'paid',
      isRecurring: false,
    },
    {
      id: 'sample-7',
      type: 'expense',
      amount: 200.00,
      date: new Date(currentYear, currentMonth, 12).toISOString(),
      description: 'Combustível',
      categoryId: 'transport',
      status: 'paid',
      isRecurring: false,
    },
    {
      id: 'sample-8',
      type: 'expense',
      amount: 89.90,
      date: new Date(currentYear, currentMonth, 15).toISOString(),
      description: 'Streaming',
      categoryId: 'entertainment',
      status: 'pending',
      isRecurring: true,
      recurrenceId: 'rec-4',
    },
    {
      id: 'sample-9',
      type: 'expense',
      amount: 350.00,
      date: new Date(currentYear, currentMonth, 20).toISOString(),
      description: 'Plano de Saúde',
      categoryId: 'health',
      status: 'pending',
      isRecurring: true,
      recurrenceId: 'rec-5',
    },
  ];

  const sampleRecurrences: Recurrence[] = [
    {
      id: 'rec-1',
      type: 'income',
      amount: 6566.16,
      description: 'Prefeitura',
      categoryId: 'salary',
      source: 'Salário mensal',
      frequency: 'monthly',
      startDate: new Date(currentYear, 0, 5).toISOString(),
      isActive: true,
      createAsPending: false,
    },
    {
      id: 'rec-2',
      type: 'expense',
      amount: 1000.00,
      description: 'Consórcio 28/64',
      categoryId: 'consortium',
      frequency: 'monthly',
      startDate: new Date(currentYear, 0, 10).toISOString(),
      isActive: true,
      createAsPending: true,
    },
    {
      id: 'rec-3',
      type: 'expense',
      amount: 1200.00,
      description: 'Aluguel',
      categoryId: 'housing',
      frequency: 'monthly',
      startDate: new Date(currentYear, 0, 5).toISOString(),
      isActive: true,
      createAsPending: true,
    },
    {
      id: 'rec-4',
      type: 'expense',
      amount: 89.90,
      description: 'Streaming',
      categoryId: 'entertainment',
      frequency: 'monthly',
      startDate: new Date(currentYear, 0, 15).toISOString(),
      isActive: true,
      createAsPending: true,
    },
    {
      id: 'rec-5',
      type: 'expense',
      amount: 350.00,
      description: 'Plano de Saúde',
      categoryId: 'health',
      frequency: 'monthly',
      startDate: new Date(currentYear, 0, 20).toISOString(),
      isActive: true,
      createAsPending: true,
    },
  ];

  const defaultData = getDefaultData();
  const dataWithSamples: AppData = {
    ...defaultData,
    transactions: sampleTransactions,
    recurrences: sampleRecurrences,
  };
  
  saveData(dataWithSamples);
}

export function hasSampleData(): boolean {
  const data = loadData();
  return data.transactions.length > 0;
}
