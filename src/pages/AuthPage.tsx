import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Mode = 'login' | 'register';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    tenantName: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({
          email: form.email,
          password: form.password,
        });

        toast.success('Login realizado com sucesso');
      } else {
        await register({
          email: form.email,
          fullName: form.fullName,
          password: form.password,
          tenantName: form.tenantName,
        });

        toast.success('Conta criada com sucesso');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao autenticar';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Entrar' : 'Criar conta'}</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Acesse sua conta SaaS para sincronizar seus dados'
              : 'Crie sua conta para habilitar o modo SaaS'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <Input
                  placeholder="Nome completo"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  required
                />
                <Input
                  placeholder="Nome da empresa/conta"
                  value={form.tenantName}
                  onChange={(event) => setForm((prev) => ({ ...prev, tenantName: event.target.value }))}
                  required
                />
              </>
            )}

            <Input
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
              minLength={8}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
              disabled={loading}
            >
              {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
