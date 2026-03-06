/**
 * AdvancedReports
 * Análise avançada anual: entradas vs saídas, breakdown por categoria,
 * evolução do saldo acumulado, maiores gastos e fontes de renda.
 */

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, PieChart, Pie, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, getMonthNameShort, parseLocalDate } from '@/lib/finance';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS = [
  '#3B82F6', '#EF4444', '#22C55E', '#F97316', '#8B5CF6',
  '#EC4899', '#14B8A6', '#EAB308', '#06B6D4', '#D946EF',
  '#64748B', '#10B981', '#F43F5E', '#6366F1', '#0EA5E9',
];

interface AdvancedReportsProps {
  year: number;
}

export function AdvancedReports({ year }: AdvancedReportsProps) {
  const { data } = useFinance();

  // ── Dados por mês ────────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const txs = data.transactions.filter(t => {
        const d = parseLocalDate(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { month: getMonthNameShort(month), income, expense, balance: income - expense };
    });
  }, [year, data.transactions]);

  // ── Saldo acumulado ──────────────────────────────────────────────────────────
  const accumulatedData = useMemo(() => {
    let acc = 0;
    return monthlyData.map(m => {
      acc += m.balance;
      return { month: m.month, saldo: acc };
    });
  }, [monthlyData]);

  // ── Totais anuais ────────────────────────────────────────────────────────────
  const yearTotals = useMemo(() => {
    return monthlyData.reduce(
      (a, m) => ({ income: a.income + m.income, expense: a.expense + m.expense }),
      { income: 0, expense: 0 }
    );
  }, [monthlyData]);

  // ── Gastos por categoria ─────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const yearExpenses = data.transactions.filter(t => {
      const d = parseLocalDate(t.date);
      return t.type === 'expense' && d.getFullYear() === year;
    });
    const total = yearExpenses.reduce((s, t) => s + t.amount, 0);
    const map = new Map<string, number>();
    yearExpenses.forEach(t => {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = data.categories.find(c => c.id === catId);
        return {
          id: catId,
          name: cat?.name ?? 'Sem categoria',
          icon: cat?.icon ?? '💸',
          amount,
          pct: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [year, data.transactions, data.categories]);

  // ── Top 5 maiores gastos individuais ─────────────────────────────────────────
  const top5Expenses = useMemo(() => {
    return data.transactions
      .filter(t => {
        const d = parseLocalDate(t.date);
        return t.type === 'expense' && d.getFullYear() === year;
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => {
        const cat = data.categories.find(c => c.id === t.categoryId);
        return { ...t, categoryName: cat?.name ?? 'Sem categoria', categoryIcon: cat?.icon ?? '💸' };
      });
  }, [year, data.transactions, data.categories]);

  // ── Fontes de renda ──────────────────────────────────────────────────────────
  const incomeSources = useMemo(() => {
    const yearIncomes = data.transactions.filter(t => {
      const d = parseLocalDate(t.date);
      return t.type === 'income' && d.getFullYear() === year;
    });
    const total = yearIncomes.reduce((s, t) => s + t.amount, 0);
    const map = new Map<string, number>();
    yearIncomes.forEach(t => {
      const catId = t.categoryId;
      map.set(catId, (map.get(catId) ?? 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = data.categories.find(c => c.id === catId);
        return {
          id: catId,
          name: cat?.name ?? 'Sem categoria',
          icon: cat?.icon ?? '💰',
          amount,
          pct: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [year, data.transactions, data.categories]);

  const pieData = categoryBreakdown.slice(0, 8).map((c, i) => ({
    name: `${c.icon} ${c.name}`,
    value: c.amount,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const hasData = data.transactions.some(t => {
    const d = parseLocalDate(t.date);
    return d.getFullYear() === year;
  });

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <span className="text-4xl">📊</span>
        <p className="text-muted-foreground text-sm">Nenhuma transação registrada em {year}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-income-soft rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowUpRight className="h-3.5 w-3.5 text-income" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Entradas</span>
          </div>
          <p className="font-bold text-income text-sm leading-tight">{formatCurrency(yearTotals.income)}</p>
        </div>
        <div className="bg-expense-soft rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowDownRight className="h-3.5 w-3.5 text-expense" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Saídas</span>
          </div>
          <p className="font-bold text-expense text-sm leading-tight">{formatCurrency(yearTotals.expense)}</p>
        </div>
        <div className={cn(
          'rounded-xl p-3 text-center',
          yearTotals.income - yearTotals.expense >= 0 ? 'bg-income-soft' : 'bg-expense-soft'
        )}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Saldo</span>
          </div>
          <p className={cn(
            'font-bold text-sm leading-tight',
            yearTotals.income - yearTotals.expense >= 0 ? 'text-income' : 'text-expense'
          )}>
            {formatCurrency(yearTotals.income - yearTotals.expense)}
          </p>
        </div>
      </div>

      {/* ── Entradas vs Saídas por mês ────────────────────────────────────── */}
      <section className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-sm">Entradas × Saídas por Mês</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={32} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'income' ? 'Entradas' : 'Saídas',
                ]}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }}
              />
              <Bar dataKey="income" fill="hsl(217,91%,60%)" radius={[3, 3, 0, 0]} name="income" />
              <Bar dataKey="expense" fill="hsl(0,72%,51%)" radius={[3, 3, 0, 0]} name="expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 justify-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" />Entradas</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />Saídas</span>
        </div>
      </section>

      {/* ── Evolução do saldo acumulado ───────────────────────────────────── */}
      <section className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Evolução do Saldo Acumulado</h3>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accumulatedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={32} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Saldo acumulado']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="hsl(217,91%,60%)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(217,91%,60%)' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Gastos por categoria ──────────────────────────────────────────── */}
      {categoryBreakdown.length > 0 && (
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-expense" />
            <h3 className="font-semibold text-sm">Gastos por Categoria</h3>
          </div>

          {/* Donut */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value)]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela */}
          <div className="space-y-2">
            {categoryBreakdown.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                <span className="text-sm flex-1 truncate">{cat.icon} {cat.name}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">{cat.pct.toFixed(1)}%</span>
                <span className="text-sm font-medium w-24 text-right">{formatCurrency(cat.amount)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Top 5 maiores gastos ──────────────────────────────────────────── */}
      {top5Expenses.length > 0 && (
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm">Top 5 Maiores Gastos do Ano</h3>
          <div className="space-y-2">
            {top5Expenses.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.categoryIcon} {t.categoryName} · {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="text-expense font-semibold text-sm whitespace-nowrap">
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Fontes de renda ───────────────────────────────────────────────── */}
      {incomeSources.length > 0 && (
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm">Principais Fontes de Renda</h3>
          <div className="space-y-2">
            {incomeSources.map((src, i) => (
              <div key={src.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate flex items-center gap-1.5">
                    <span>{src.icon}</span>
                    <span>{src.name}</span>
                  </span>
                  <span className="font-medium text-income ml-2 whitespace-nowrap">
                    {formatCurrency(src.amount)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-income"
                    style={{ width: `${Math.min(100, src.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
