import { Check, Clock, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { Transaction, Category } from '@/types/finance';
import { formatCurrency } from '@/lib/finance';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onToggleStatus: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionItem({ 
  transaction, 
  category,
  onToggleStatus, 
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const isPaid = transaction.status === 'paid';

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50",
        "transition-all hover:shadow-md animate-slide-up"
      )}
    >
      {/* Status Toggle */}
      <button
        onClick={() => onToggleStatus(transaction)}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
          isPaid 
            ? "bg-success text-success-foreground" 
            : "bg-warning/20 text-warning border-2 border-warning"
        )}
      >
        {isPaid ? (
          <Check className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{transaction.description}</span>
          {transaction.isRecurring && (
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {category && (
            <span className="flex items-center gap-1">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </span>
          )}
          {transaction.source && (
            <>
              <span>•</span>
              <span className="truncate">{transaction.source}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "font-bold text-sm",
          isIncome ? "text-income" : "text-expense"
        )}>
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </span>
        <button
          onClick={() => onEdit(transaction)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
            title="Deletar"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        )}
      </div>
    </div>
  );
}
