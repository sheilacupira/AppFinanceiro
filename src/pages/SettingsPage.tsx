import { useState } from 'react';
import { Moon, Sun, Upload, Download, Church } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { exportData, importData } from '@/lib/storage';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { data, updateSettings, refreshData } = useFinance();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const handleThemeToggle = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateSettings({ theme: dark ? 'dark' : 'light' });
  };

  const handleExport = async () => {
    const jsonData = exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Try Web Share API first
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], 'financeiro-backup.json', { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Backup Financeiro',
            files: [file],
          });
          toast.success('Backup compartilhado!');
          return;
        }
      } catch (err) {
        // Fallback to download
      }
    }
    
    // Fallback: download file
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup baixado!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        importData(jsonString, importMode === 'merge');
        refreshData();
        toast.success(importMode === 'merge' ? 'Dados mesclados!' : 'Dados substituídos!');
      } catch {
        toast.error('Erro ao importar arquivo');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="pb-24 space-y-6">
      <h1 className="text-xl font-bold">Configurações</h1>

      {/* Tithe Setting */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-income-soft flex items-center justify-center">
            <Church className="w-5 h-5 text-income" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Sou Dizimista</p>
            <p className="text-sm text-muted-foreground">
              Calcular 10% das entradas automaticamente
            </p>
          </div>
          <Switch
            checked={data.settings.isTither}
            onCheckedChange={(checked) => updateSettings({ isTither: checked })}
          />
        </div>
      </div>

      {/* Theme Setting */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            {isDark ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">Tema Escuro</p>
            <p className="text-sm text-muted-foreground">
              Alternar entre claro e escuro
            </p>
          </div>
          <Switch
            checked={isDark}
            onCheckedChange={handleThemeToggle}
          />
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-4">
        <h2 className="font-bold flex items-center gap-2">
          <Download className="w-5 h-5" />
          Backup
        </h2>

        {/* Export */}
        <Button onClick={handleExport} className="w-full" variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Exportar Dados (JSON)
        </Button>

        {/* Import Mode Toggle */}
        <div className="space-y-2">
          <Label>Modo de Importação</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setImportMode('merge')}
              className={cn(
                "py-2 rounded-lg font-medium text-sm transition-all",
                importMode === 'merge'
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              Mesclar
            </button>
            <button
              onClick={() => setImportMode('replace')}
              className={cn(
                "py-2 rounded-lg font-medium text-sm transition-all",
                importMode === 'replace'
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              Substituir Tudo
            </button>
          </div>
        </div>

        {/* Import */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Importar Dados
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Importar Backup</AlertDialogTitle>
              <AlertDialogDescription>
                {importMode === 'merge' 
                  ? 'Os dados serão mesclados com os existentes.'
                  : 'ATENÇÃO: Todos os dados atuais serão substituídos!'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction asChild>
                <label className="cursor-pointer">
                  Selecionar Arquivo
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>Financeiro PWA v1.0</p>
        <p>Dados salvos localmente no seu dispositivo</p>
      </div>
    </div>
  );
}
