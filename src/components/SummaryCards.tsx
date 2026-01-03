import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/finance';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function SummaryCards({ totalIncome, totalExpense, balance }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Entradas */}
      <div className="bg-income-soft rounded-lg p-3 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-income flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-income-foreground" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Entradas</span>
        </div>
        <p className="text-lg font-bold text-income truncate">
          {formatCurrency(totalIncome)}
        </p>
      </div>

      {/* Saídas */}
      <div className="bg-expense-soft rounded-lg p-3 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-expense flex items-center justify-center">
            <TrendingDown className="w-3.5 h-3.5 text-expense-foreground" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Saídas</span>
        </div>
        <p className="text-lg font-bold text-expense truncate">
          {formatCurrency(totalExpense)}
        </p>
      </div>

      {/* Saldo */}
      <div 
        className={cn(
          "rounded-lg p-3 animate-fade-in",
          balance >= 0 ? "bg-income-soft" : "bg-expense-soft"
        )}
        style={{ animationDelay: '100ms' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            balance >= 0 ? "bg-income" : "bg-expense"
          )}>
            <Wallet className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Saldo</span>
        </div>
        <p className={cn(
          "text-lg font-bold truncate",
          balance >= 0 ? "text-income" : "text-expense"
        )}>
          {formatCurrency(balance)}
        </p>
      </div>
    </div>
  );
}
