import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  onClear: () => void;
}

export function DateRangeFilter({ 
  startDate, 
  endDate, 
  onDateChange, 
  onClear 
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.value, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(startDate, e.target.value);
  };

  const isFiltered = startDate || endDate;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "gap-2",
          isFiltered && "border-income bg-income-soft text-income"
        )}
      >
        <Calendar className="w-4 h-4" />
        {isFiltered ? 'Filtrado' : 'Data'}
      </Button>

      {isOpen && (
        <div className="absolute top-10 left-0 bg-card border border-border rounded-lg shadow-lg p-4 z-50 w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
              />
            </div>

            <div className="flex gap-2">
              {isFiltered && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClear();
                    setIsOpen(false);
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
