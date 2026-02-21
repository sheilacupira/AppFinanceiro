# Workflow Completo: Stripe Pricing Setup

Este guia mostra o fluxo completo do início ao fim para configurar os preços do Stripe.

---

## 🎯 Objetivo final

Permitir que usuários assinem os planos Pro e Enterprise diretamente pelo app, com pagamento processado pelo Stripe.

---

## 📊 Visão geral do processo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. STRIPE DASHBOARD                                         │
│    • Criar Products                                         │
│    • Criar Prices (mensal e anual)                          │
│    • Copiar Price IDs                                       │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CONFIGURAR BACKEND                                       │
│    • Adicionar Price IDs no server/.env                     │
│    • Adicionar chaves de API (Secret Key, Webhook Secret)   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. VALIDAR CONFIGURAÇÃO                                     │
│    • Executar ./validate-stripe.sh                          │
│    • Corrigir variáveis faltantes (se houver)               │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CONFIGURAR WEBHOOKS                                      │
│    • Criar endpoint no Stripe Dashboard                     │
│    • Configurar eventos necessários                         │
│    • Copiar webhook secret                                  │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. TESTAR LOCALMENTE                                        │
│    • Usar cartões de teste                                  │
│    • Verificar webhook com Stripe CLI                       │
│    • Confirmar assinatura criada                            │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. DEPLOY EM PRODUÇÃO                                       │
│    • Repetir processo em Live Mode                          │
│    • Configurar vars de ambiente no hosting                 │
│    • Testar com pagamento real                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Passo a passo prático

### Dia 1: Setup inicial (30-60 min)

#### ✅ Etapa 1: Criar conta Stripe
```bash
# Acesse
https://dashboard.stripe.com/register

# Complete o cadastro
# Ative "Test Mode" (toggle no topo)
```

#### ✅ Etapa 2: Criar Products e Prices

**Plano Pro:**
1. Products → Add product
2. Name: `AppFinanceiro Pro`
3. Description: `Plano Pro para profissionais`
4. Add price → R$ 29,90 BRL, Monthly
5. Add another price → R$ 299,00 BRL, Yearly
6. Save product
7. **Copiar Price IDs** (3 pontinhos → Copy price ID)

**Plano Enterprise:**
1. Products → Add product
2. Name: `AppFinanceiro Enterprise`
3. Description: `Plano Enterprise para empresas`
4. Add price → R$ 99,90 BRL, Monthly
5. Add another price → R$ 999,00 BRL, Yearly
6. Save product
7. **Copiar Price IDs**

#### ✅ Etapa 3: Copiar API Keys
```bash
# Vá em: Developers → API keys
# Copie:
# - Publishable key (começa com pk_test_)
# - Secret key (começa com sk_test_)
```

#### ✅ Etapa 4: Preencher variáveis de ambiente

```bash
# 1. Copiar template
cp STRIPE_CONFIG_TEMPLATE.env server/.env.stripe

# 2. Editar e preencher com os valores copiados
nano server/.env.stripe

# 3. Mesclar com .env principal
cat server/.env.stripe >> server/.env

# 4. Validar
./validate-stripe.sh
```

---

### Dia 2: Webhooks e testes (30 min)

#### ✅ Etapa 5: Configurar webhooks localmente

```bash
# 1. Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Fazer login
stripe login

# 3. Escutar webhooks
stripe listen --forward-to localhost:4000/api/billing/webhook

# 4. Copiar o webhook secret exibido no terminal
# Adicionar em server/.env:
STRIPE_WEBHOOK_SECRET=whsec_...

# 5. Revalidar
./validate-stripe.sh
```

#### ✅ Etapa 6: Testar checkout

```bash
# 1. Iniciar backend
cd server
npm run dev

# 2. Em outro terminal, iniciar frontend
cd ..
npm run dev

# 3. Abrir navegador
http://localhost:8080/config

# 4. Clicar em "Fazer Upgrade" no Plano Pro
# 5. Usar cartão de teste:
#    Número: 4242 4242 4242 4242
#    Data: qualquer futura
#    CVC: 123

# 6. Verificar no terminal do backend:
#    → Webhook recebido
#    → Subscription criada no banco
```

---

### Dia 3: Deploy em produção (variável)

#### ✅ Etapa 7: Repetir no Live Mode

```bash
# 1. No Stripe Dashboard, desativar "Test Mode"
# 2. Repetir etapas 2-4, mas agora em Live Mode
# 3. Copiar novos Price IDs (começam com price_1...)
# 4. Copiar Live API key (começa com sk_live_...)
```

#### ✅ Etapa 8: Configurar webhook em produção

```bash
# 1. Webhooks → Add endpoint
# Endpoint URL: https://seu-dominio.com/api/billing/webhook

# 2. Selecionar eventos:
#    - checkout.session.completed
#    - customer.subscription.created
#    - customer.subscription.updated
#    - customer.subscription.deleted
#    - invoice.payment_succeeded
#    - invoice.payment_failed

# 3. Copiar Signing secret (whsec_...)
```

#### ✅ Etapa 9: Deploy do backend

```bash
# Exemplo com Render, Railway, Heroku, etc.
# Configurar variáveis de ambiente:

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_1...
STRIPE_PRICE_PRO_YEARLY=price_1...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_1...
```

#### ✅ Etapa 10: Teste final em produção

```bash
# 1. Acesse seu domínio de produção
# 2. Faça upgrade usando cartão real
# 3. Verifique:
#    - Checkout completo
#    - Webhook recebido
#    - Subscription ativa no banco
#    - Usuário tem acesso aos recursos Pro/Enterprise
```

---

## 🧪 Cartões de teste (Test Mode)

| Cenário | Número do cartão |
|---------|------------------|
| ✅ Sucesso | 4242 4242 4242 4242 |
| ✅ Requer 3D Secure | 4000 0027 6000 3184 |
| ❌ Falha genérica | 4000 0000 0000 0002 |
| ❌ Saldo insuficiente | 4000 0000 0000 9995 |
| ❌ Cartão expirado | 4000 0000 0000 0069 |

**Data de expiração:** qualquer data futura  
**CVC:** qualquer 3 dígitos  
**CEP:** qualquer valor

---

## 🎓 Troubleshooting

### "Price not found"
- Verifique se os Price IDs estão corretos
- Certifique-se de estar usando chaves do mesmo ambiente (test ou live)

### "Webhook signature verification failed"
- Verifique se `STRIPE_WEBHOOK_SECRET` está correto
- Certifique-se de estar usando o secret do ambiente correto

### "Invalid API key"
- Verifique se `STRIPE_SECRET_KEY` está preenchida
- Test keys começam com `sk_test_`
- Live keys começam com `sk_live_`

### Checkout não abre
- Verifique se o backend está rodando
- Inspecione o console do navegador (F12)
- Verifique se `VITE_API_BASE_URL` está configurada no frontend

---

## 📚 Arquivos de referência

| Arquivo | Propósito |
|---------|-----------|
| `docs/STRIPE_PRICING_SETUP.md` | Guia detalhado passo a passo |
| `docs/STRIPE_QUICK_REFERENCE.md` | Checklist e referência rápida |
| `STRIPE_CONFIG_TEMPLATE.env` | Template de configuração |
| `validate-stripe.sh` | Script de validação |
| `src/lib/plans.ts` | Definição dos planos (preços na UI) |
| `server/src/lib/stripe.ts` | Cliente Stripe + Price ID mapping |
| `server/src/routes/billing.ts` | Rotas de checkout e webhooks |

---

## ✅ Checklist final

```
[ ] Products criados no Stripe Dashboard
[ ] Prices criados (mensal e anual, Pro e Enterprise)
[ ] API Keys copiadas
[ ] server/.env configurado
[ ] ./validate-stripe.sh passou sem erros
[ ] Webhook configurado (local ou produção)
[ ] Teste de checkout funcionando
[ ] Webhook recebido e processado
[ ] Subscription criada no banco
[ ] Usuário tem acesso aos recursos do plano
```

---

## 🎉 Pronto!

Agora seu sistema de billing está configurado e funcionando. Usuários podem:
- Ver os planos disponíveis
- Fazer upgrade via Stripe Checkout
- Gerenciar assinatura no Customer Portal
- Receber invoices automaticamente
- Cancelar ou alterar plano

---

**Última atualização:** 21/02/2026
