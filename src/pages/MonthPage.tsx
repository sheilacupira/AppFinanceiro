import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import { MonthNavigator } from '@/components/MonthNavigator';
import { SummaryCards } from '@/components/SummaryCards';
import { FilterChips, FilterType } from '@/components/FilterChips';
import { SearchBar } from '@/components/SearchBar';
import { TransactionBlock } from '@/components/TransactionBlock';
import { TransactionForm } from '@/components/TransactionForm';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { ExpenseCategoryChart } from '@/components/ExpenseCategoryChart';
import { Transaction } from '@/types/finance';

export function MonthPage() {
  const { 
    data, 
    currentMonth, 
    currentYear, 
    navigateMonth,
    updateTransaction,
    addTransaction,
    deleteTransaction,
  } = useFinance();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const allTransactions = useMemo(
    () =>
      data.transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }),
    [data.transactions, currentMonth, currentYear]
  );

  const summary = useMemo(() => {
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: currentMonth,
      year: currentYear,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [allTransactions, currentMonth, currentYear]);

  const filteredTransactions = useMemo(() => {
    let result = allTransactions;

    // Apply date range filter
    if (startDate || endDate) {
      result = result.filter(t => {
        const txDate = new Date(t.date);
        if (startDate && txDate < new Date(startDate)) return false;
        if (endDate && txDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Apply filter
    switch (filter) {
      case 'paid':
        result = result.filter(t => t.status === 'paid');
        break;
      case 'pending':
        result = result.filter(t => t.status === 'pending');
        break;
      case 'recurring':
        result = result.filter(t => t.isRecurring);
        break;
      case 'variable':
        result = result.filter(t => !t.isRecurring);
        break;
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => {
        const category = data.categories.find(c => c.id === t.categoryId);
        return (
          t.description.toLowerCase().includes(searchLower) ||
          t.source?.toLowerCase().includes(searchLower) ||
          category?.name.toLowerCase().includes(searchLower)
        );
      });
    }

    return result;
  }, [allTransactions, filter, search, data.categories, startDate, endDate]);

  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

  const incomeTotal = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleToggleStatus = (transaction: Transaction) => {
    updateTransaction({
      ...transaction,
      status: transaction.status === 'paid' ? 'pending' : 'paid',
    });
  };

  const handleSaveTransaction = (transaction: Transaction) => {
    if (editingTransaction) {
      updateTransaction(transaction);
      toast({
        description: '✅ Lançamento atualizado com sucesso!',
      });
    } else {
      addTransaction(transaction);
      toast({
        description: '✅ Lançamento adicionado com sucesso!',
      });
    }
    setEditingTransaction(null);
    setIsAddingTransaction(false);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    toast({
      description: '✅ Lançamento deletado com sucesso!',
    });
  };

  return (
    <div className="pb-24 space-y-4">
      {/* Month Navigator */}
      <MonthNavigator 
        month={currentMonth} 
        year={currentYear} 
        onNavigate={navigateMonth} 
      />

      {/* Summary Cards */}
      <SummaryCards
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        balance={summary.balance}
      />

      {/* Chart */}
      <ExpenseCategoryChart 
        transactions={allTransactions}
        categories={data.categories}
      />

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <FilterChips activeFilter={filter} onFilterChange={setFilter} />
        <DateRangeFilter 
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          onClear={() => {
            setStartDate('');
            setEndDate('');
          }}
        />
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar descrição, categoria, fonte..."
      />

      {/* Transaction Blocks */}
      <div className="space-y-6">
        <TransactionBlock
          type="income"
          transactions={incomeTransactions}
          categories={data.categories}
          total={incomeTotal}
          onToggleStatus={handleToggleStatus}
          onEdit={setEditingTransaction}
          onDelete={handleDeleteTransaction}
        />

        <TransactionBlock
          type="expense"
          transactions={expenseTransactions}
          categories={data.categories}
          total={expenseTotal}
          onToggleStatus={handleToggleStatus}
          onEdit={setEditingTransaction}
          onDelete={handleDeleteTransaction}
        />
      </div>

      {/* Floating Add Button */}
      <FloatingAddButton onClick={() => setIsAddingTransaction(true)} />

      {/* Transaction Form Modal */}
      {(isAddingTransaction || editingTransaction) && (
        <TransactionForm
          transaction={editingTransaction || undefined}
          categories={data.categories}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
          onClose={() => {
            setEditingTransaction(null);
            setIsAddingTransaction(false);
          }}
          defaultDate={new Date(currentYear, currentMonth, new Date().getDate())}
        />
      )}
    </div>
  );
}
