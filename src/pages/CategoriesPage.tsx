import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { Category, TransactionType } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMOJI_OPTIONS = ['💰', '💼', '🏠', '🍽️', '🚗', '🏥', '📚', '🎬', '🛍️', '📄', '💸', '⛪', '🏦', '💻', '📈', '🎁', '✈️', '🎮'];

export function CategoriesPage() {
  const { data, addCategory, updateCategory, deleteCategory } = useFinance();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const incomeCategories = data.categories.filter(c => c.type === 'income' || c.type === 'both');
  const expenseCategories = data.categories.filter(c => c.type === 'expense' || c.type === 'both');

  const handleDelete = (id: string) => {
    const success = deleteCategory(id);
    if (!success) {
      toast.error('Esta categoria está em uso e não pode ser excluída');
    } else {
      toast.success('Categoria excluída');
    }
  };

  const CategoryItem = ({ category }: { category: Category }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
        {category.icon}
      </div>
      <span className="flex-1 font-medium">{category.name}</span>
      <button
        onClick={() => setEditingCategory(category)}
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
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Categorias em uso não podem ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(category.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Categorias</h1>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova
        </Button>
      </div>

      {/* Income Categories */}
      <div className="space-y-3">
        <h2 className="font-medium text-income flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Entradas
        </h2>
        {incomeCategories.map(c => <CategoryItem key={c.id} category={c} />)}
      </div>

      {/* Expense Categories */}
      <div className="space-y-3">
        <h2 className="font-medium text-expense flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Saídas
        </h2>
        {expenseCategories.map(c => <CategoryItem key={c.id} category={c} />)}
      </div>

      {/* Form Modal */}
      {(isAdding || editingCategory) && (
        <CategoryForm
          category={editingCategory || undefined}
          onSave={(cat) => {
            if (editingCategory) {
              updateCategory(cat);
            } else {
              addCategory(cat);
            }
            setEditingCategory(null);
            setIsAdding(false);
          }}
          onClose={() => {
            setEditingCategory(null);
            setIsAdding(false);
          }}
        />
      )}
    </div>
  );
}

interface CategoryFormProps {
  category?: Category;
  onSave: (category: Category) => void;
  onClose: () => void;
}

function CategoryForm({ category, onSave, onClose }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [type, setType] = useState<TransactionType | 'both'>(category?.type || 'expense');
  const [icon, setIcon] = useState(category?.icon || '💰');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: category?.id || `cat-${Date.now()}`,
      name: name.trim(),
      type,
      icon,
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-lg animate-slide-up">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-lg font-bold">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Icon Selector */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-xl transition-all",
                    icon === emoji
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-secondary hover:bg-accent"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome da categoria"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as TransactionType | 'both')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Entrada</SelectItem>
                <SelectItem value="expense">Saída</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
