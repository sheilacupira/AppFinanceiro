import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <h1 className="text-2xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: março de 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="text-base font-semibold mb-2">1. Quem somos</h2>
            <p>O <strong>Financeiro</strong> é um aplicativo de controle financeiro pessoal e empresarial. Esta Política descreve como coletamos, usamos e protegemos seus dados, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">2. Dados que coletamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cadastro:</strong> nome completo, e-mail e número de WhatsApp.</li>
              <li><strong>Dados financeiros:</strong> transações, categorias, recorrências e extratos que você mesmo inserir ou importar.</li>
              <li><strong>Dados de uso:</strong> logs de acesso (IP, data/hora) para segurança.</li>
              <li><strong>Pagamentos:</strong> processados pelo Mercado Pago — não armazenamos dados de cartão.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">3. Como usamos seus dados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fornecer e melhorar o serviço.</li>
              <li>Enviar o link de recuperação de senha via WhatsApp.</li>
              <li>Processar pagamentos de assinatura.</li>
              <li>Garantir a segurança da conta.</li>
              <li>Cumprir obrigações legais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">4. Compartilhamento de dados</h2>
            <p>Não vendemos seus dados. Compartilhamos apenas com:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Mercado Pago:</strong> processamento de pagamentos.</li>
              <li><strong>Evolution API / WhatsApp:</strong> envio de mensagens de recuperação de senha.</li>
              <li><strong>Railway e Vercel:</strong> infraestrutura de hospedagem.</li>
              <li>Autoridades legais, quando exigido por lei.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">5. Segurança</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Senhas armazenadas com hash bcrypt (nunca em texto puro).</li>
              <li>Comunicação criptografada via HTTPS.</li>
              <li>Autenticação com tokens JWT de curta duração.</li>
              <li>Banco de dados em ambiente seguro no Railway.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">6. Seus direitos (LGPD)</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acessar os dados que temos sobre você.</li>
              <li>Corrigir dados incompletos ou incorretos.</li>
              <li>Solicitar a exclusão de sua conta e dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
              <li>Portabilidade dos seus dados financeiros (exportação CSV).</li>
            </ul>
            <p className="mt-2">Para exercer esses direitos, entre em contato pelo e-mail de suporte.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">7. Cookies e armazenamento local</h2>
            <p>Usamos <code>localStorage</code> para armazenar tokens de sessão e preferências do usuário (tema, configurações). Não utilizamos cookies de rastreamento ou publicidade.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">8. Retenção de dados</h2>
            <p>Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, os dados são removidos em até 30 dias, exceto o que for exigido por obrigação legal.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">9. Menores de idade</h2>
            <p>Não coletamos intencionalmente dados de menores de 13 anos. Se identificarmos esse caso, a conta será removida.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">10. Contato</h2>
            <p>Dúvidas sobre privacidade? Entre em contato: <strong>contato@appfinanceiro.com</strong></p>
          </section>

        </div>
      </div>
    </div>
  );
}
