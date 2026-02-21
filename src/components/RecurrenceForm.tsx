import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Recurrence, TransactionType, Category } from '@/types/finance';
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
import { cn } from '@/lib/utils';

interface RecurrenceFormProps {
  recurrence?: Recurrence;
  categories: Category[];
  onSave: (recurrence: Recurrence) => void;
  onClose: () => void;
}

export function RecurrenceForm({
  recurrence,
  categories,
  onSave,
  onClose,
}: RecurrenceFormProps) {
  const isEditing = !!recurrence;
  
  const [type, setType] = useState<TransactionType>(recurrence?.type || 'expense');
  const [amountDisplay, setAmountDisplay] = useState(
    recurrence ? formatCurrencyInput(String(Math.round(recurrence.amount * 100))) : 'R$ 0,00'
  );
  const [description, setDescription] = useState(recurrence?.description || '');
  const [categoryId, setCategoryId] = useState(recurrence?.categoryId || '');
  const [source, setSource] = useState(recurrence?.source || '');
  const [createAsPending, setCreateAsPending] = useState(recurrence?.createAsPending ?? true);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseCurrencyInput(amountDisplay);
    if (amount <= 0) return;
    
    const newRecurrence: Recurrence = {
      id: recurrence?.id || generateId(),
      type,
      amount,
      description,
      categoryId,
      source: source || undefined,
      frequency: 'monthly',
      startDate: recurrence?.startDate || new Date().toISOString(),
      isActive: recurrence?.isActive ?? true,
      createAsPending,
    };
    
    onSave(newRecurrence);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-lg animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {isEditing ? 'Editar Recorrência' : 'Nova Recorrência'}
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
                type === 'income' ? "text-income" : "text-expense"
              )}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário, Aluguel..."
              required
            />
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

          {/* Create as Pending */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <Label htmlFor="pending" className="cursor-pointer">
              Criar como Pendente
            </Label>
            <Switch
              id="pending"
              checked={createAsPending}
              onCheckedChange={setCreateAsPending}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
