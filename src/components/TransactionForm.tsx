import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Transaction, TransactionType, TransactionStatus, Category } from '@/types/finance';
import { formatCurrencyInput, parseCurrencyInput, generateId } from '@/lib/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  transaction?: Transaction;
  categories: Category[];
  onSave: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  defaultDate?: Date;
}

export function TransactionForm({
  transaction,
  categories,
  onSave,
  onDelete,
  onClose,
  defaultDate = new Date(),
}: TransactionFormProps) {
  const { toast } = useToast();
  const isEditing = !!transaction;
  
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense');
  const [amountDisplay, setAmountDisplay] = useState(
    transaction ? formatCurrencyInput(String(Math.round(transaction.amount * 100))) : 'R$ 0,00'
  );
  const [date, setDate] = useState(
    transaction 
      ? new Date(transaction.date).toISOString().split('T')[0]
      : defaultDate.toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(transaction?.description || '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
  const [source, setSource] = useState(transaction?.source || '');
  const [status, setStatus] = useState<TransactionStatus>(transaction?.status || 'pending');
  const [isRecurring, setIsRecurring] = useState(transaction?.isRecurring || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter(
    c => c.type === type || c.type === 'both'
  );

  useEffect(() => {
    if (!categoryId || !filteredCategories.find(c => c.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id || '');
    }
  }, [type, filteredCategories, categoryId]);

  const handleAmountChange = (value: string) => {
    setAmountDisplay(formatCurrencyInput(value));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const amount = parseCurrencyInput(amountDisplay);
    if (amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que 0';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    if (!date) {
      newErrors.date = 'Data é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        description: '❌ Verifique os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }
    
    const amount = parseCurrencyInput(amountDisplay);
    
    const newTransaction: Transaction = {
      id: transaction?.id || generateId(),
      type,
      amount,
      date: new Date(date).toISOString(),
      description,
      categoryId,
      source: source || undefined,
      status,
      isRecurring,
      recurrenceId: transaction?.recurrenceId,
      isTithe: transaction?.isTithe,
    };
    
    onSave(newTransaction);
    onClose();
  };

  const handleDelete = () => {
    if (transaction && onDelete) {
      onDelete(transaction.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-lg animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                "py-3 rounded-lg font-medium transition-all",
                type === 'income'
                  ? "bg-income text-income-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                "py-3 rounded-lg font-medium transition-all",
                type === 'expense'
                  ? "bg-expense text-expense-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              Saída
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amountDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={cn(
                "text-xl font-bold text-center",
                type === 'income' ? "text-income" : "text-expense",
                errors.amount && "border-destructive"
              )}
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={errors.date ? "border-destructive" : ""}
            />
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário, Aluguel..."
              className={errors.description ? "border-destructive" : ""}
              required
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Fonte/Origem (opcional)</Label>
            <Input
              id="source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Ex: Cliente ABC, Empresa..."
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <Label htmlFor="status" className="cursor-pointer">
              Status: {status === 'paid' ? '✅ PG' : '⏳ Pendente'}
            </Label>
            <Switch
              id="status"
              checked={status === 'paid'}
              onCheckedChange={(checked) => setStatus(checked ? 'paid' : 'pending')}
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <Label htmlFor="recurring" className="cursor-pointer">
              Recorrente (mensal)
            </Label>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {isEditing && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className={cn(
                "flex-1",
                type === 'income' ? "bg-income hover:bg-income/90" : "bg-expense hover:bg-expense/90"
              )}
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
