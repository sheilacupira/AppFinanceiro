import { Calendar, BarChart3, RefreshCw, Tag, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavPage = 'month' | 'year' | 'recurrences' | 'categories' | 'settings';

interface BottomNavProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const navItems: { page: NavPage; icon: typeof Calendar; label: string }[] = [
  { page: 'month', icon: Calendar, label: 'Mês' },
  { page: 'year', icon: BarChart3, label: 'Ano' },
  { page: 'recurrences', icon: RefreshCw, label: 'Fixas' },
  { page: 'categories', icon: Tag, label: 'Categorias' },
  { page: 'settings', icon: Settings, label: 'Config' },
];

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-pb z-40">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all",
              activePage === page
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "w-5 h-5 transition-transform",
              activePage === page && "scale-110"
            )} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
