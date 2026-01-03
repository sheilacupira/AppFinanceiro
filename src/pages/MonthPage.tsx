import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { MonthNavigator } from '@/components/MonthNavigator';
import { SummaryCards } from '@/components/SummaryCards';
import { FilterChips, FilterType } from '@/components/FilterChips';
import { SearchBar } from '@/components/SearchBar';
import { TransactionBlock } from '@/components/TransactionBlock';
import { TransactionForm } from '@/components/TransactionForm';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { getMonthSummary, getMonthTransactions } from '@/lib/finance';
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
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const summary = useMemo(
    () => getMonthSummary(currentMonth, currentYear),
    [currentMonth, currentYear, data.transactions]
  );

  const allTransactions = useMemo(
    () => getMonthTransactions(currentMonth, currentYear),
    [currentMonth, currentYear, data.transactions]
  );

  const filteredTransactions = useMemo(() => {
    let result = allTransactions;

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
  }, [allTransactions, filter, search, data.categories]);

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
    } else {
      addTransaction(transaction);
    }
    setEditingTransaction(null);
    setIsAddingTransaction(false);
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

      {/* Filters */}
      <FilterChips activeFilter={filter} onFilterChange={setFilter} />

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
        />

        <TransactionBlock
          type="expense"
          transactions={expenseTransactions}
          categories={data.categories}
          total={expenseTotal}
          onToggleStatus={handleToggleStatus}
          onEdit={setEditingTransaction}
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
          onDelete={deleteTransaction}
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
