import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { getMonthNameShort, formatCurrency } from '@/lib/finance';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';

export function YearPage() {
  const { data, setCurrentMonth, setCurrentYear } = useFinance();
  const [year, setYear] = useState(() => new Date().getFullYear());

  const summaries = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const monthTransactions = data.transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
      });

      const totalIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month,
        year,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      };
    });
  }, [year, data.transactions]);

  const chartData = summaries.map((s, i) => ({
    month: getMonthNameShort(i),
    balance: s.balance,
  }));

  const yearTotals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        income: acc.income + s.totalIncome,
        expense: acc.expense + s.totalExpense,
        balance: acc.balance + s.balance,
      }),
      { income: 0, expense: 0, balance: 0 }
    );
  }, [summaries]);

  const handleMonthClick = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setCurrentYear(year);
  };

  return (
    <div className="pb-24 space-y-6">
      {/* Year Navigator */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={() => setYear(y => y - 1)}
          className="p-2 rounded-full hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold min-w-[80px] text-center">{year}</h2>
        <button
          onClick={() => setYear(y => y + 1)}
          className="p-2 rounded-full hover:bg-accent transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Year Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-income-soft rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Entradas</p>
          <p className="font-bold text-income">{formatCurrency(yearTotals.income)}</p>
        </div>
        <div className="bg-expense-soft rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Saídas</p>
          <p className="font-bold text-expense">{formatCurrency(yearTotals.expense)}</p>
        </div>
        <div className={cn(
          "rounded-lg p-3 text-center",
          yearTotals.balance >= 0 ? "bg-income-soft" : "bg-expense-soft"
        )}>
          <p className="text-xs text-muted-foreground mb-1">Saldo</p>
          <p className={cn(
            "font-bold",
            yearTotals.balance >= 0 ? "text-income" : "text-expense"
          )}>
            {formatCurrency(yearTotals.balance)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <h3 className="font-medium mb-4">Saldo por Mês</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.balance >= 0 ? 'hsl(217, 91%, 60%)' : 'hsl(0, 72%, 51%)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly List */}
      <div className="space-y-2">
        <h3 className="font-medium px-1">Meses</h3>
        {summaries.map((summary, index) => (
          <button
            key={index}
            onClick={() => handleMonthClick(index)}
            className="w-full flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <span className="font-medium">{getMonthNameShort(index)}</span>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-income">+{formatCurrency(summary.totalIncome)}</span>
              <span className="text-expense">-{formatCurrency(summary.totalExpense)}</span>
              <span className={cn(
                "font-bold min-w-[80px] text-right",
                summary.balance >= 0 ? "text-income" : "text-expense"
              )}>
                {formatCurrency(summary.balance)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
