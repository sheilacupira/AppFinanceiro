import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Church, Building2, Users, UserPlus, Copy, Trash2, ShieldCheck } from 'lucide-react';
import { isSaasMode } from '@/config/runtime';
import { useAuth, type TenantMember, type PendingInvite } from '@/contexts/AuthContext';
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
  const { session, logout, refreshSession, listProfiles, switchProfile, createProfile, updateTenant,
    listMembers, inviteCollaborator, listPendingInvites, cancelInvite, updateMemberRole, removeMember } = useAuth();
  const navigate = useNavigate();
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
  const [pjCnpj, setPjCnpj] = useState('');
  const [pjRazaoSocial, setPjRazaoSocial] = useState('');
  const [savingPJData, setSavingPJData] = useState(false);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState('');
  const currentProfile = profiles.find((profile) => profile.isCurrent);
  const isBusinessProfile = (session?.tenant.profileType ?? currentProfile?.tenant.profileType) === 'business';
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

  useEffect(() => {
    if (session?.tenant.profileType === 'business') {
      setPjCnpj(session.tenant.cnpj ?? '');
      setPjRazaoSocial(session.tenant.razaoSocial ?? '');
    }
  }, [session?.tenant.cnpj, session?.tenant.profileType, session?.tenant.razaoSocial]);

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

  // Load members and pending invites
  useEffect(() => {
    if (!isSaasMode || !session || activeBillingPlan === 'free') return;
    const load = async () => {
      const [m, inv] = await Promise.all([listMembers(), listPendingInvites()]);
      setMembers(m);
      setPendingInvites(inv);
    };
    void load();
  }, [session, activeBillingPlan, listMembers, listPendingInvites]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { inviteUrl } = await inviteCollaborator({ email: inviteEmail.trim(), role: inviteRole });
      setLastInviteUrl(inviteUrl);
      setInviteEmail('');
      const inv = await listPendingInvites();
      setPendingInvites(inv);
      toast.success('Convite criado!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar convite');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      await cancelInvite(id);
      setPendingInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success('Convite cancelado');
    } catch {
      toast.error('Erro ao cancelar convite');
    }
  };

  const handleRoleChange = async (userId: string, role: 'ADMIN' | 'MEMBER') => {
    try {
      await updateMemberRole(userId, role);
      setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role } : m));
      toast.success('Papel atualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar papel');
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    try {
      await removeMember(userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success(`${name} removido da equipe`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover membro');
    }
  };

  const handleSavePJData = async () => {
    setSavingPJData(true);
    try {
      await updateTenant({
        cnpj: pjCnpj.trim() || null,
        razaoSocial: pjRazaoSocial.trim() || null,
      });
      toast.success('Dados da empresa salvos');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar dados';
      toast.error(message);
    } finally {
      setSavingPJData(false);
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

      {/* PJ Company Data */}
      {isSaasMode && session && isBusinessProfile && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Dados da Empresa (PJ)</p>
              <p className="text-sm text-muted-foreground">CNPJ e razão social do perfil atual</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">CNPJ</label>
              <Input
                placeholder="00.000.000/0001-00"
                value={pjCnpj}
                onChange={(e) => setPjCnpj(e.target.value)}
                maxLength={18}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Razão Social</label>
              <Input
                placeholder="Ex: Empresa Exemplo LTDA"
                value={pjRazaoSocial}
                onChange={(e) => setPjRazaoSocial(e.target.value)}
              />
            </div>
            <Button className="w-full" size="sm" disabled={savingPJData} onClick={() => void handleSavePJData()}>
              {savingPJData ? 'Salvando...' : 'Salvar dados'}
            </Button>
          </div>
        </div>
      )}

      {/* Team Members */}
      {isSaasMode && session && activeBillingPlan !== 'free' && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Equipe</p>
              <p className="text-sm text-muted-foreground">Membros com acesso a esta conta</p>
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between rounded-md border p-2 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {member.role === 'OWNER' && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Owner</span>
                  )}
                  {member.role === 'ADMIN' && session.role === 'OWNER' && !member.isCurrentUser && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs"
                      onClick={() => void handleRoleChange(member.userId, 'MEMBER')}>
                      <ShieldCheck className="w-3 h-3 mr-1" />Admin
                    </Button>
                  )}
                  {member.role === 'MEMBER' && session.role === 'OWNER' && !member.isCurrentUser && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs"
                      onClick={() => void handleRoleChange(member.userId, 'ADMIN')}>
                      Membro
                    </Button>
                  )}
                  {session.role === 'OWNER' && !member.isCurrentUser && member.role !== 'OWNER' && (
                    <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive"
                      onClick={() => void handleRemoveMember(member.userId, member.fullName)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                  {member.isCurrentUser && (
                    <span className="text-xs text-muted-foreground">(você)</span>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum membro carregado ainda.</p>
            )}
          </div>

          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Convites pendentes</p>
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md border border-dashed p-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.role === 'ADMIN' ? 'Admin' : 'Membro'} · expira {new Date(inv.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive shrink-0"
                    onClick={() => void handleCancelInvite(inv.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Invite URL copy */}
          {lastInviteUrl && (
            <div className="rounded-md bg-muted p-3 space-y-1">
              <p className="text-xs font-medium">Link do convite (compartilhe com o convidado):</p>
              <div className="flex gap-2">
                <p className="text-xs text-muted-foreground truncate flex-1">{lastInviteUrl}</p>
                <Button size="sm" variant="outline" className="h-7 shrink-0"
                  onClick={() => { void navigator.clipboard.writeText(lastInviteUrl); toast.success('Link copiado!'); }}>
                  <Copy className="w-3 h-3 mr-1" />Copiar
                </Button>
              </div>
            </div>
          )}

          {/* Invite form — only OWNER/ADMIN */}
          {(session.role === 'OWNER' || session.role === 'ADMIN') && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium flex items-center gap-1">
                <UserPlus className="w-4 h-4" /> Convidar colaborador
              </p>
              <Input
                placeholder="email@exemplo.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm"
                  variant={inviteRole === 'MEMBER' ? 'default' : 'outline'}
                  onClick={() => setInviteRole('MEMBER')}>
                  Membro
                </Button>
                {session.role === 'OWNER' && (
                  <Button type="button" size="sm"
                    variant={inviteRole === 'ADMIN' ? 'default' : 'outline'}
                    onClick={() => setInviteRole('ADMIN')}>
                    Admin
                  </Button>
                )}
              </div>
              <Button className="w-full" size="sm" disabled={inviting || !inviteEmail.trim()}
                onClick={() => void handleInvite()}>
                {inviting ? 'Enviando...' : 'Gerar convite'}
              </Button>
            </div>
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
          <BillingManager userId={session.user.email} tenantPlan={session.tenant.billingPlan} />
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

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              void refreshSession().then(() => toast.success('Plano atualizado!'));
            }}
          >
            Atualizar plano
          </Button>

          {session?.user.email === 'sheilacupira@gmail.com' && (
            <Button
              variant="outline"
              className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
              onClick={() => navigate('/admin/dashboard')}
            >
              🛡️ Painel Admin
            </Button>
          )}

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
