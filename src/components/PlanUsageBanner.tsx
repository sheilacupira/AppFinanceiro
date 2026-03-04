import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { checkLimit } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

/**
 * Exibe uma barra de uso do plano Free.
 * Visível apenas para usuários no plano gratuito em modo SaaS.
 */
export function PlanUsageBanner() {
  const { session } = useAuth();
  const { data, currentMonth, currentYear } = useFinance();

  const plan = session?.tenant.billingPlan ?? 'free';

  const monthTxCount = useMemo(() => {
    return data.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [data.transactions, currentMonth, currentYear]);

  if (plan !== 'free') return null;

  const txLimit = checkLimit('free', 'transactions', monthTxCount);
  const recLimit = checkLimit('free', 'recurrences', data.recurrences.length);
  const catLimit = checkLimit('free', 'categories', data.categories.length);

  const txMax = typeof txLimit.limit === 'number' ? txLimit.limit : 100;
  const pct = Math.min(100, Math.round((monthTxCount / txMax) * 100));

  const isWarning = pct >= 80 && pct < 100;
  const isOver = pct >= 100;

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-xs space-y-1.5',
        isOver
          ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
          : isWarning
          ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300'
          : 'bg-muted/50 border-border text-muted-foreground'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {isOver
            ? '⚠️ Limite atingido — faça upgrade para continuar'
            : `Plano Free · ${monthTxCount}/${txMax} transações este mês`}
        </span>
        <a
          href="#billing"
          onClick={() => { window.location.hash = '#billing'; }}
          className={cn(
            'flex items-center gap-1 font-semibold underline underline-offset-2',
            isOver ? 'text-red-700 dark:text-red-300' : 'text-primary'
          )}
        >
          <Zap className="w-3 h-3" />
          Upgrade
        </a>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Avisos de outros limites */}
      {(!recLimit.allowed || !catLimit.allowed) && (
        <p className="text-[10px] opacity-75">
          {!recLimit.allowed && 'Limite de recorrências atingido. '}
          {!catLimit.allowed && 'Limite de categorias atingido.'}
        </p>
      )}
    </div>
  );
}
