import { TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction, Category, TransactionType } from '@/types/finance';
import { TransactionItem } from './TransactionItem';
import { formatCurrency } from '@/lib/finance';
import { cn } from '@/lib/utils';

interface TransactionBlockProps {
  type: TransactionType;
  transactions: Transaction[];
  categories: Category[];
  total: number;
  onToggleStatus: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionBlock({
  type,
  transactions,
  categories,
  total,
  onToggleStatus,
  onEdit,
  onDelete,
}: TransactionBlockProps) {
  const isIncome = type === 'income';
  const Icon = isIncome ? TrendingUp : TrendingDown;
  const title = isIncome ? 'ENTRADAS' : 'SAÍDAS';

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        isIncome ? "bg-income-soft" : "bg-expense-soft"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isIncome ? "bg-income" : "bg-expense"
          )}>
            <Icon className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className={cn(
            "font-bold text-sm",
            isIncome ? "text-income" : "text-expense"
          )}>
            {title}
          </span>
        </div>
        <span className={cn(
          "font-bold",
          isIncome ? "text-income" : "text-expense"
        )}>
          {formatCurrency(total)}
        </span>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nenhum lançamento
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((transaction, index) => (
            <div key={transaction.id} style={{ animationDelay: `${index * 50}ms` }}>
              <TransactionItem
                transaction={transaction}
                category={getCategoryById(transaction.categoryId)}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
