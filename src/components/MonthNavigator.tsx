import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName } from '@/lib/finance';

interface MonthNavigatorProps {
  month: number;
  year: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function MonthNavigator({ month, year, onNavigate }: MonthNavigatorProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <button
        onClick={() => onNavigate('prev')}
        className="p-2 rounded-full hover:bg-accent transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="text-center min-w-[160px]">
        <h2 className="text-lg font-bold">
          {getMonthName(month)} {year}
        </h2>
      </div>
      
      <button
        onClick={() => onNavigate('next')}
        className="p-2 rounded-full hover:bg-accent transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
