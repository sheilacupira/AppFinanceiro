import { useState } from 'react';
import { RefreshCw, Pencil, Trash2, Pause, Play, Plus } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import { Recurrence, TransactionType } from '@/types/finance';
import { formatCurrency, generateId } from '@/lib/finance';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RecurrenceForm } from '@/components/RecurrenceForm';

export function RecurrencesPage() {
  const { data, updateRecurrence, deleteRecurrence, addRecurrence } = useFinance();
  const { toast } = useToast();
  const [editingRecurrence, setEditingRecurrence] = useState<Recurrence | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const incomeRecurrences = data.recurrences.filter(r => r.type === 'income');
  const expenseRecurrences = data.recurrences.filter(r => r.type === 'expense');

  const handleToggleActive = (recurrence: Recurrence) => {
    updateRecurrence({ ...recurrence, isActive: !recurrence.isActive });
    toast({
      description: `✅ Recorrência ${recurrence.isActive ? 'pausada' : 'ativada'}!`,
    });
  };

  const handleSave = (recurrence: Recurrence) => {
    if (editingRecurrence) {
      updateRecurrence(recurrence);
      toast({
        description: '✅ Recorrência atualizada com sucesso!',
      });
    } else {
      addRecurrence(recurrence);
      toast({
        description: '✅ Recorrência criada com sucesso!',
      });
    }
    setEditingRecurrence(null);
    setIsAdding(false);
  };

  const handleDelete = (recurrence: Recurrence) => {
    deleteRecurrence(recurrence.id);
    toast({
      description: '✅ Recorrência deletada com sucesso!',
    });
  };

  const RecurrenceItem = ({ recurrence }: { recurrence: Recurrence }) => {
    const category = data.categories.find(c => c.id === recurrence.categoryId);
    const isIncome = recurrence.type === 'income';

    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50",
        !recurrence.isActive && "opacity-60"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          isIncome ? "bg-income-soft" : "bg-expense-soft"
        )}>
          <RefreshCw className={cn(
            "w-5 h-5",
            isIncome ? "text-income" : "text-expense"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{recurrence.description}</p>
          <p className="text-xs text-muted-foreground">
            {category?.icon} {category?.name}
            {recurrence.createAsPending ? ' • Nasce Pendente' : ' • Nasce PG'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            "font-bold text-sm",
            isIncome ? "text-income" : "text-expense"
          )}>
            {formatCurrency(recurrence.amount)}
          </span>

          <button
            onClick={() => handleToggleActive(recurrence)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              recurrence.isActive ? "hover:bg-accent" : "hover:bg-success/20"
            )}
          >
            {recurrence.isActive ? (
              <Pause className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Play className="w-4 h-4 text-success" />
            )}
          </button>

          <button
            onClick={() => setEditingRecurrence(recurrence)}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-1.5 rounded-md hover:bg-destructive/20 transition-colors">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir recorrência?</AlertDialogTitle>
                <AlertDialogDescription>
                  Lançamentos já criados não serão afetados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(recurrence)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Recorrências</h1>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova
        </Button>
      </div>

      {/* Income Recurrences */}
      <div className="space-y-3">
        <h2 className="font-medium text-income flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Entradas Fixas
        </h2>
        {incomeRecurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma entrada recorrente
          </p>
        ) : (
          incomeRecurrences.map(r => <RecurrenceItem key={r.id} recurrence={r} />)
        )}
      </div>

      {/* Expense Recurrences */}
      <div className="space-y-3">
        <h2 className="font-medium text-expense flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Saídas Fixas
        </h2>
        {expenseRecurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma saída recorrente
          </p>
        ) : (
          expenseRecurrences.map(r => <RecurrenceItem key={r.id} recurrence={r} />)
        )}
      </div>

      {/* Form Modal */}
      {(isAdding || editingRecurrence) && (
        <RecurrenceForm
          recurrence={editingRecurrence || undefined}
          categories={data.categories}
          onSave={handleSave}
          onClose={() => {
            setEditingRecurrence(null);
            setIsAdding(false);
          }}
        />
      )}
    </div>
  );
}
