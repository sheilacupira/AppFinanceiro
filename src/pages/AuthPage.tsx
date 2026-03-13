import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register' | 'forgot';

export function AuthPage() {
  const { login, register, forgotPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    tenantName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^\+?[0-9]{10,15}$/.test(phone.replace(/[\s\-().]/g, ''));

  const validate = (): boolean => {
    const next: Partial<typeof form> = {};
    if (!isValidEmail(form.email.trim())) next.email = 'E-mail inválido';
    if (form.password.length < 8) next.password = 'Mínimo 8 caracteres';
    if (mode === 'register') {
      if (form.fullName.trim().length < 2) next.fullName = 'Informe seu nome completo';
      if (form.tenantName.trim().length < 2) next.tenantName = 'Informe um nome para a conta';
      if (form.phone.trim() && !isValidPhone(form.phone)) next.phone = 'WhatsApp inválido (ex: 11999999999)';
      if (form.password !== form.confirmPassword) next.confirmPassword = 'As senhas não correspondem';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const email = form.email.trim().toLowerCase();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email, password: form.password });
        toast.success('Bem-vindo de volta!');
      } else {
        await register({
          email,
          phone: form.phone.trim(),
          fullName: form.fullName.trim(),
          password: form.password,
          tenantName: form.tenantName.trim(),
        });
        toast.success('Conta criada com sucesso!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao autenticar';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(form.email.trim())) {
      setErrors({ email: 'Digite um e-mail válido' });
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(form.email.trim().toLowerCase());
      toast.success('Se este e-mail estiver cadastrado, você receberá o link em breve.');
      setMode('login');
    } catch {
      toast.success('Se este e-mail estiver cadastrado, você receberá o link em breve.');
      setMode('login');
    } finally {
      setLoading(false);
    }
  };

  const goTo = (m: Mode) => () => { setMode(m); setErrors({}); };

  const titles: Record<Mode, string> = {
    login: 'Bem-vindo de volta',
    register: 'Criar conta',
    forgot: 'Recuperar senha',
  };
  const subtitles: Record<Mode, string> = {
    login: 'Entre para acessar seus dados financeiros',
    register: 'Preencha os dados abaixo para começar',
    forgot: 'Informe seu e-mail e enviaremos o link de recuperação',
  };

  const PasswordToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Branding */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
          <Wallet className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controle financeiro pessoal e empresarial</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{titles[mode]}</h2>
          <p className="text-sm text-muted-foreground">{subtitles[mode]}</p>
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                className={cn(errors.email && 'border-destructive')}
                disabled={loading}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button type="button" className="text-xs text-primary hover:underline" onClick={goTo('forgot')}>
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set('password')}
                  className={cn('pr-10', errors.password && 'border-destructive')}
                  disabled={loading}
                />
                <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ainda não tem conta?{' '}
              <button type="button" className="text-primary hover:underline font-medium" onClick={goTo('register')}>
                Criar conta
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTRO ── */}
        {mode === 'register' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                placeholder="João da Silva"
                autoComplete="name"
                value={form.fullName}
                onChange={set('fullName')}
                className={cn(errors.fullName && 'border-destructive')}
                disabled={loading}
              />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenantName">Nome da conta</Label>
              <Input
                id="tenantName"
                placeholder="Finanças Pessoais ou Nome da Empresa"
                value={form.tenantName}
                onChange={set('tenantName')}
                className={cn(errors.tenantName && 'border-destructive')}
                disabled={loading}
              />
              {errors.tenantName && <p className="text-xs text-destructive">{errors.tenantName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email">E-mail</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                className={cn(errors.email && 'border-destructive')}
                disabled={loading}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-phone">WhatsApp <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                id="reg-phone"
                type="tel"
                placeholder="11999999999 (sem espaços)"
                autoComplete="tel"
                value={form.phone}
                onChange={set('phone')}
                className={cn(errors.phone && 'border-destructive')}
                disabled={loading}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Senha</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  className={cn('pr-10', errors.password && 'border-destructive')}
                  disabled={loading}
                />
                <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  className={cn('pr-10', errors.confirmPassword && 'border-destructive')}
                  disabled={loading}
                />
                <PasswordToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <button type="button" className="text-primary hover:underline font-medium" onClick={goTo('login')}>
                Entrar
              </button>
            </p>
          </form>
        )}

        {/* ── ESQUECI SENHA ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">E-mail</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                className={cn(errors.email && 'border-destructive')}
                disabled={loading}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Lembrou a senha?{' '}
              <button type="button" className="text-primary hover:underline font-medium" onClick={goTo('login')}>
                Voltar ao login
              </button>
            </p>
          </form>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
        Ao criar uma conta você concorda com nossos{' '}
        <a href="#" className="underline hover:text-foreground">Termos de Uso</a>
        {' '}e{' '}
        <a href="#" className="underline hover:text-foreground">Política de Privacidade</a>.
      </p>
    </div>
  );
}

