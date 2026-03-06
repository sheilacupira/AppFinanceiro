import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Wallet, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'Mínimo 8 caracteres';
    if (password !== confirmPassword) next.confirmPassword = 'As senhas não correspondem';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || !token) return;
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      toast.success('Senha redefinida! Redirecionando...');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Token inválido ou expirado.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
        {done ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <div>
              <p className="font-semibold text-base">Senha redefinida!</p>
              <p className="text-sm text-muted-foreground mt-1">Redirecionando para o login...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Redefinir senha</h2>
              <p className="text-sm text-muted-foreground">Digite e confirme sua nova senha abaixo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                    className={cn('pr-10', errors.password && 'border-destructive')}
                    disabled={loading}
                  />
                  <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
                    className={cn('pr-10', errors.confirmPassword && 'border-destructive')}
                    disabled={loading}
                  />
                  <PasswordToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Lembrou a senha?{' '}
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => navigate('/')}>
                  Voltar ao login
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
