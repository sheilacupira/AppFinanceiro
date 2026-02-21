import { useState } from 'react';
import { Moon, Sun, Church } from 'lucide-react';
import { isSaasMode } from '@/config/runtime';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { BackupManager } from '@/components/BackupManager';
import { StatementImportManager } from '@/components/StatementImportManager';

export function SettingsPage() {
  const { data, updateSettings } = useFinance();
  const { session, logout } = useAuth();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const handleThemeToggle = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateSettings({ theme: dark ? 'dark' : 'light' });
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
      <BackupManager />

      {/* Statement Import */}
      <StatementImportManager />

      {isSaasMode && session && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div>
            <p className="font-medium">Conta SaaS</p>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
            <p className="text-xs text-muted-foreground">Organização: {session.tenant.name}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => void logout()}>
            Sair da conta
          </Button>
        </div>
      )}

      {/* App Info */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>Financeiro PWA v1.0</p>
        <p>Dados salvos localmente no seu dispositivo</p>
      </div>
    </div>
  );
}
