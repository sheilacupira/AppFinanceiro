import { useEffect, useState } from 'react';
import { Moon, Sun, Church } from 'lucide-react';
import { isSaasMode } from '@/config/runtime';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackupManager } from '@/components/BackupManager';
import { StatementImportManager } from '@/components/StatementImportManager';
import { BankConnectionManager } from '@/components/BankConnectionManager';
import { BillingManager } from '@/components/BillingManager';
import { toast } from 'sonner';

export function SettingsPage() {
  const { data, updateSettings } = useFinance();
  const { session, logout, listProfiles, switchProfile, createProfile } = useAuth();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = data.settings.theme;
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [profiles, setProfiles] = useState<Array<{ tenant: { id: string; name: string; profileType?: 'personal' | 'business'; billingPlan?: 'free' | 'pro' | 'enterprise' }; role: 'OWNER' | 'ADMIN' | 'MEMBER'; isCurrent: boolean }>>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<'personal' | 'business'>('personal');
  const [switchingProfile, setSwitchingProfile] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const currentProfile = profiles.find((profile) => profile.isCurrent);
  const activeBillingPlan = session?.tenant.billingPlan ?? currentProfile?.tenant.billingPlan ?? 'free';
  const canCreateBusinessProfile = activeBillingPlan !== 'free';
  const activeBillingPlanLabel =
    activeBillingPlan === 'free' ? 'Grátis' : activeBillingPlan === 'pro' ? 'Pró' : 'Premium';

  useEffect(() => {
    const loadProfiles = async () => {
      if (!isSaasMode || !session) {
        return;
      }

      const response = await listProfiles();
      setProfiles(response);
    };

    void loadProfiles();
  }, [listProfiles, session]);

  const handleSwitchProfile = async (tenantId: string) => {
    setSwitchingProfile(true);
    try {
      await switchProfile(tenantId);
      const response = await listProfiles();
      setProfiles(response);
      toast.success('Perfil alterado com sucesso');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao trocar perfil';
      toast.error(message);
    } finally {
      setSwitchingProfile(false);
    }
  };

  const handleCreateProfile = async () => {
    if (newProfileType === 'business' && !canCreateBusinessProfile) {
      toast.error('Perfil PJ disponível apenas para planos pagos.');
      return;
    }

    setCreatingProfile(true);
    try {
      const fallbackName = newProfileType === 'personal'
        ? `${session?.user.fullName || 'Meu Perfil'} (Pessoal)`
        : 'Minha Empresa';

      await createProfile({
        name: newProfileName.trim() || fallbackName,
        profileType: newProfileType,
      });
      setNewProfileName('');
      const response = await listProfiles();
      setProfiles(response);
      toast.success('Perfil criado com sucesso');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar perfil';
      toast.error(message);
    } finally {
      setCreatingProfile(false);
    }
  };

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

      {/* PF/PJ Profile Switch */}
      {isSaasMode && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div>
            <p className="font-medium">Perfil de uso (PF/PJ)</p>
            <p className="text-sm text-muted-foreground">
              Use a mesma conta para finanças pessoais e da empresa
            </p>
          </div>

          {!session ? (
            <p className="text-sm text-muted-foreground">
              Entre na conta SaaS para habilitar a troca de perfil.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {profiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum perfil encontrado ainda.
                  </p>
                ) : (
                  profiles.map((profile) => (
                    <div key={profile.tenant.id} className="flex items-center justify-between rounded-md border p-2">
                      <div>
                        <p className="text-sm font-medium">{profile.tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.tenant.profileType === 'personal' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={profile.isCurrent ? 'secondary' : 'outline'}
                        disabled={profile.isCurrent || switchingProfile}
                        onClick={() => void handleSwitchProfile(profile.tenant.id)}
                      >
                        {profile.isCurrent ? 'Atual' : 'Entrar'}
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Novo perfil</p>
                <Input
                  placeholder={newProfileType === 'personal' ? 'Ex: Finanças Pessoais' : 'Ex: Minha Empresa LTDA'}
                  value={newProfileName}
                  onChange={(event) => setNewProfileName(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newProfileType === 'personal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setNewProfileType('personal');
                      if (!newProfileName.trim()) {
                        setNewProfileName(`${session?.user.fullName || 'Meu Perfil'} (Pessoal)`);
                      }
                    }}
                  >
                    Pessoa Física
                  </Button>
                  <Button
                    type="button"
                    variant={newProfileType === 'business' ? 'default' : 'outline'}
                    size="sm"
                    disabled={!canCreateBusinessProfile}
                    onClick={() => {
                      setNewProfileType('business');
                      if (!newProfileName.trim()) {
                        setNewProfileName('Minha Empresa');
                      }
                    }}
                  >
                    Pessoa Jurídica
                  </Button>
                </div>
                {!canCreateBusinessProfile && (
                  <p className="text-xs text-muted-foreground">
                    Perfil PJ disponível apenas em planos pagos.
                  </p>
                )}
                <Button className="w-full" size="sm" disabled={creatingProfile} onClick={() => void handleCreateProfile()}>
                  {creatingProfile ? 'Criando...' : 'Criar e entrar'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Backup Section */}
      <BackupManager />

      {/* Statement Import */}
      <StatementImportManager />

      {/* Open Finance */}
      <div className="bg-card rounded-lg border border-border p-6">
        <BankConnectionManager />
      </div>

      {/* Billing */}
      {isSaasMode && session && (
        <div className="bg-card rounded-lg border border-border p-6">
          <BillingManager userId={session.user.email} />
        </div>
      )}

      {isSaasMode && session && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div>
            <p className="font-medium">Conta SaaS</p>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
            <p className="text-xs text-muted-foreground">Organização: {session.tenant.name}</p>
            <p className="text-xs text-muted-foreground">Plano: {activeBillingPlanLabel}</p>
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
