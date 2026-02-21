import { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, Category } from '@/types/finance';
import { formatCurrency } from '@/lib/finance';

interface ExpenseCategoryChartProps {
  transactions: Transaction[];
  categories: Category[];
}

const COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#D946EF', '#EC4899', '#F43F5E', '#64748B'
];

export function ExpenseCategoryChart({ transactions, categories }: ExpenseCategoryChartProps) {
  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense' && !t.isTithe);
    
    const categoryExpenses = new Map<string, number>();
    expenses.forEach(expense => {
      const current = categoryExpenses.get(expense.categoryId) || 0;
      categoryExpenses.set(expense.categoryId, current + expense.amount);
    });

    const total = Array.from(categoryExpenses.values()).reduce((sum, val) => sum + val, 0);

    return Array.from(categoryExpenses.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : '0';
        return {
          name: `${category?.icon || '💰'} ${category?.name || 'Sem categoria'} (${percentage}%)`,
          value: Math.round(amount * 100) / 100,
          amount: formatCurrency(amount),
          fill: COLORS[(categoryId.charCodeAt(0)) % COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground">Nenhuma saída registrada este mês</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name }) => name}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
              border: 'none',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend with values */}
      <div className="mt-6 space-y-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-foreground">{item.name.split('(')[0].trim()}</span>
            </div>
            <span className="font-medium text-foreground">{item.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
