import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'paid' | 'pending' | 'recurring' | 'variable';

interface FilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'PG' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'recurring', label: 'Fixas' },
  { value: 'variable', label: 'Variáveis' },
];

export function FilterChips({ activeFilter, onFilterChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
            activeFilter === filter.value
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
