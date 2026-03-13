import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <h1 className="text-2xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: março de 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="text-base font-semibold mb-2">1. Aceitação dos Termos</h2>
            <p>Ao criar uma conta ou utilizar o aplicativo <strong>Financeiro</strong>, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">2. Descrição do Serviço</h2>
            <p>O Financeiro é um aplicativo de controle financeiro pessoal e empresarial que permite registrar transações, categorias, recorrências, importar extratos bancários e gerenciar seu orçamento.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">3. Cadastro e Conta</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Você deve fornecer informações verídicas no cadastro.</li>
              <li>É responsável por manter a confidencialidade de sua senha.</li>
              <li>Uma conta por usuário. O compartilhamento de credenciais é proibido.</li>
              <li>Menores de 18 anos devem ter autorização dos responsáveis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">4. Planos e Pagamentos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>O plano Grátis está disponível sem custo com recursos limitados.</li>
              <li>Os planos pagos (Pró e Premium) são cobrados mensalmente ou anualmente via Mercado Pago.</li>
              <li>O cancelamento pode ser feito a qualquer momento; o acesso permanece até o fim do período pago.</li>
              <li>Não há reembolso por períodos parciais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">5. Uso Permitido</h2>
            <p>Você concorda em não:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Usar o serviço para fins ilegais ou fraudulentos.</li>
              <li>Tentar acessar contas de outros usuários.</li>
              <li>Realizar engenharia reversa ou copiar o código do aplicativo.</li>
              <li>Sobrecarregar os servidores com requisições automatizadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">6. Disponibilidade</h2>
            <p>Nos esforçamos para manter o serviço disponível 24/7, mas não garantimos disponibilidade ininterrupta. Podemos realizar manutenções programadas com aviso prévio.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">7. Limitação de Responsabilidade</h2>
            <p>O Financeiro é uma ferramenta de controle financeiro e não oferece consultoria financeira, contábil ou jurídica. As decisões financeiras são de sua exclusiva responsabilidade.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">8. Suspensão e Encerramento</h2>
            <p>Podemos suspender ou encerrar contas que violem estes Termos. Você pode solicitar a exclusão de sua conta a qualquer momento pelo email de suporte.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">9. Alterações nos Termos</h2>
            <p>Podemos atualizar estes Termos. Notificaremos usuários via app ou WhatsApp em caso de mudanças significativas. O uso continuado após a notificação indica aceite.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">10. Legislação Aplicável</h2>
            <p>Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de domicílio do usuário para dirimir eventuais conflitos.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
