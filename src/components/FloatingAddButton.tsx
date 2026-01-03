import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-20 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
