import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-24 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 z-50 border-0 cursor-pointer"
      aria-label="Adicionar transação"
      title="Adicionar entrada ou saída"
    >
      <Plus className="w-6 h-6 stroke-2" />
    </button>
  );
}
