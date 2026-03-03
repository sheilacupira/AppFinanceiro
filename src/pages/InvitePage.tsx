import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/apiClient';
import { toast } from 'sonner';

type InviteInfo = {
  email: string;
  role: string;
  expiresAt: string;
  tenant: { name: string; profileType: string };
  inviterName: string;
};

type PageState = 'loading' | 'valid' | 'invalid' | 'accepted';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { status, session, acceptInvite, switchProfile } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) { setPageState('invalid'); setErrorMsg('Link inválido.'); return; }

    apiRequest<{ invite: InviteInfo }>(`/api/invites/${token}`)
      .then((r) => { setInviteInfo(r.invite); setPageState('valid'); })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Convite inválido ou expirado.';
        setErrorMsg(msg);
        setPageState('invalid');
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const result = await acceptInvite(token);
      setPageState('accepted');
      toast.success(`Você entrou em "${result.tenantName}"`);
      // Switch to the new tenant automatically
      await switchProfile(result.tenantId);
      setTimeout(() => navigate('/'), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao aceitar convite.';
      toast.error(msg);
    } finally {
      setAccepting(false);
    }
  };

  const roleLabel = inviteInfo?.role === 'ADMIN' ? 'Administrador' : 'Membro';
  const isLoggedIn = status === 'authenticated' && session !== null;
  const emailMatches = isLoggedIn && session?.user.email === inviteInfo?.email;

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pageState === 'accepted') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h1 className="text-2xl font-bold">Convite aceito!</h1>
        <p className="text-muted-foreground">Redirecionando para o painel...</p>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4 text-center">
        <XCircle className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold">Convite inválido</h1>
        <p className="text-muted-foreground max-w-sm">{errorMsg}</p>
        <Button variant="outline" onClick={() => navigate('/')}>Ir para o início</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Você foi convidado!</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{inviteInfo?.inviterName}</span> convidou você para entrar em uma equipe
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Equipe</p>
              <p className="font-medium">{inviteInfo?.tenant.name}</p>
              <p className="text-xs text-muted-foreground">
                {inviteInfo?.tenant.profileType === 'business' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-md border p-3">
            <Users className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Seu papel</p>
              <p className="font-medium">{roleLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-md border p-3">
            <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Expira em</p>
              <p className="font-medium">
                {inviteInfo ? new Date(inviteInfo.expiresAt).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {!isLoggedIn && (
            <>
              <p className="text-sm text-center text-muted-foreground">
                Faça login com <span className="font-medium text-foreground">{inviteInfo?.email}</span> para aceitar este convite.
              </p>
              <Button className="w-full" onClick={() => navigate('/')}>
                Fazer login
              </Button>
            </>
          )}

          {isLoggedIn && !emailMatches && (
            <>
              <p className="text-sm text-center text-amber-600 dark:text-amber-400">
                Este convite é para <span className="font-medium">{inviteInfo?.email}</span>.<br />
                Você está logado como <span className="font-medium">{session?.user.email}</span>.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Trocar conta
              </Button>
            </>
          )}

          {isLoggedIn && emailMatches && (
            <Button className="w-full" disabled={accepting} onClick={() => void handleAccept()}>
              {accepting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aceitando...</>
              ) : (
                'Aceitar convite'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
