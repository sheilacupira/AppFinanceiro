# Guia Visual: Stripe Dashboard

Este documento descreve visualmente onde encontrar cada elemento no Stripe Dashboard.

---

## 🎨 Layout do Stripe Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│ STRIPE                          [Test Mode ▼]  [Conta] [Ajuda]  │
├──────────────────────────────────────────────────────────────────┤
│ MENU LATERAL                    ÁREA PRINCIPAL                   │
│                                                                   │
│ • Home                          [Conteúdo da página ativa]       │
│ • Payments                                                        │
│ • Customers                                                       │
│ • Products           ◄─── COMEÇAR AQUI                           │
│ • Subscriptions                                                   │
│ • Billing                                                         │
│ • Developers                                                      │
│   ├─ API keys        ◄─── COPIAR CHAVES                         │
│   ├─ Webhooks        ◄─── CONFIGURAR WEBHOOK                    │
│   └─ Logs                                                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📦 1. Criando Products

### Navegação
```
Menu lateral → Products → [+ Add product]
```

### Formulário de Product

```
┌────────────────────────────────────────────────────────┐
│ Add a product                                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Name                                                   │
│ ┌────────────────────────────────────────────────┐   │
│ │ AppFinanceiro Pro                              │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Description (optional)                                 │
│ ┌────────────────────────────────────────────────┐   │
│ │ Plano Pro para profissionais e PMEs            │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Statement descriptor (optional)                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ APPFIN PRO                                     │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                        │
│ Pricing model                                          │
│ ○ Standard pricing                                     │
│ ○ Package pricing                                      │
│ ● Recurring                        ◄─── SELECIONAR   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 💰 2. Criando Prices

### Formulário de Price (Mensal)

```
┌────────────────────────────────────────────────────────┐
│ Pricing                                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Price                                                  │
│ ┌─────┐  ┌──────────────────────────────────────┐   │
│ │ BRL │  │ 29.90                                 │   │
│ └─────┘  └──────────────────────────────────────┘   │
│          ▲                                            │
│          └─── PREENCHER VALOR                         │
│                                                        │
│ Billing period                                         │
│ ○ Daily                                                │
│ ○ Weekly                                               │
│ ● Monthly                          ◄─── SELECIONAR   │
│ ○ Every 3 months                                       │
│ ○ Every 6 months                                       │
│ ○ Yearly                                               │
│                                                        │
│ Price description (optional)                           │
│ ┌────────────────────────────────────────────────┐   │
│ │ Mensal                                         │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ [ + Add another price ]            ◄─── CLICAR       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Formulário de Price (Anual)

```
┌────────────────────────────────────────────────────────┐
│ Pricing (continued)                                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Price                                                  │
│ ┌─────┐  ┌──────────────────────────────────────┐   │
│ │ BRL │  │ 299.00                                │   │
│ └─────┘  └──────────────────────────────────────┘   │
│          ▲                                            │
│          └─── VALOR ANUAL (17% desconto)              │
│                                                        │
│ Billing period                                         │
│ ○ Daily                                                │
│ ○ Weekly                                               │
│ ○ Monthly                                              │
│ ○ Every 3 months                                       │
│ ○ Every 6 months                                       │
│ ● Yearly                           ◄─── SELECIONAR   │
│                                                        │
│ Price description (optional)                           │
│ ┌────────────────────────────────────────────────┐   │
│ │ Anual (economize 17%)                          │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│                         [ Cancel ]  [ Save product ]  │
│                                     ▲                  │
│                                     └─── SALVAR        │
└────────────────────────────────────────────────────────┘
```

---

## 📋 3. Copiando Price IDs

### Lista de Prices no Product

```
┌────────────────────────────────────────────────────────┐
│ AppFinanceiro Pro                                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Pricing                                                │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ R$ 29,90 / month                               │   │
│ │ Mensal                                         │   │
│ │ price_1NXZabcdefGHIJKL         [⋮]             │   │
│ │                                 ▲               │   │
│ │                                 │               │   │
│ │                                 └─ CLICAR       │   │
│ │                                                 │   │
│ │   ┌────────────────────────────────────┐       │   │
│ │   │ Copy price ID  ◄─── COPIAR        │       │   │
│ │   │ Edit price                         │       │   │
│ │   │ Archive price                      │       │   │
│ │   └────────────────────────────────────┘       │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ R$ 299,00 / year                               │   │
│ │ Anual (economize 17%)                          │   │
│ │ price_1NXZxyzdefABCDEF         [⋮]             │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Repetir processo para:**
- AppFinanceiro Enterprise (R$ 99,90/mês e R$ 999,00/ano)

---

## 🔑 4. Copiando API Keys

### Navegação
```
Menu lateral → Developers → API keys
```

### Tela de API Keys

```
┌────────────────────────────────────────────────────────┐
│ API keys                           [Test Mode ▼]       │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Standard keys                                          │
│                                                        │
│ Publishable key                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ pk_test_51NZabcdef...                [Reveal] │   │
│ │                                                 │   │
│ │                           [Copy]  ◄─── COPIAR  │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Secret key                             ⚠️ Sensitive   │
│ ┌────────────────────────────────────────────────┐   │
│ │ sk_test_51NZghijkl...               [Reveal]  │   │
│ │                                                 │   │
│ │                           [Copy]  ◄─── COPIAR  │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ⚠️ Keep your keys secret. Store them securely.       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Copiar:**
- ✅ Secret key → `STRIPE_SECRET_KEY` no `server/.env`
- ✅ Publishable key → `VITE_STRIPE_PUBLISHABLE_KEY` no `.env` do frontend

---

## 🪝 5. Configurando Webhooks

### Navegação
```
Menu lateral → Developers → Webhooks → [+ Add endpoint]
```

### Formulário de Webhook

```
┌────────────────────────────────────────────────────────┐
│ Add an endpoint                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Endpoint URL                                           │
│ ┌────────────────────────────────────────────────┐   │
│ │ https://seu-dominio.com/api/billing/webhook    │   │
│ └────────────────────────────────────────────────┘   │
│ ▲                                                      │
│ └─── URL do seu backend em produção                   │
│                                                        │
│ Description (optional)                                 │
│ ┌────────────────────────────────────────────────┐   │
│ │ AppFinanceiro Production Webhook                │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Events to send                                         │
│ ○ Listen to all events                                 │
│ ● Select events                    ◄─── SELECIONAR   │
│                                                        │
│   [ + Select events ]              ◄─── CLICAR       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Seleção de Eventos

```
┌────────────────────────────────────────────────────────┐
│ Select events to listen to                            │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Search for event types...                             │
│ ┌────────────────────────────────────────────────┐   │
│ │ checkout                                        │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ☑ checkout.session.completed       ◄─── MARCAR       │
│ ☐ checkout.session.async_payment_failed              │
│ ☐ checkout.session.expired                            │
│                                                        │
│ Search for event types...                             │
│ ┌────────────────────────────────────────────────┐   │
│ │ subscription                                    │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ☑ customer.subscription.created    ◄─── MARCAR       │
│ ☑ customer.subscription.updated    ◄─── MARCAR       │
│ ☑ customer.subscription.deleted    ◄─── MARCAR       │
│ ☐ customer.subscription.paused                        │
│                                                        │
│ Search for event types...                             │
│ ┌────────────────────────────────────────────────┐   │
│ │ invoice                                         │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ☑ invoice.payment_succeeded        ◄─── MARCAR       │
│ ☑ invoice.payment_failed           ◄─── MARCAR       │
│ ☐ invoice.created                                      │
│                                                        │
│                         [ Cancel ]  [ Add endpoint ]  │
└────────────────────────────────────────────────────────┘
```

### Copiar Webhook Secret

Após criar o webhook:

```
┌────────────────────────────────────────────────────────┐
│ Webhook endpoint details                               │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Signing secret                         ⚠️ Sensitive   │
│ ┌────────────────────────────────────────────────┐   │
│ │ whsec_abc123def456...               [Reveal]  │   │
│ │                                                 │   │
│ │                           [Copy]  ◄─── COPIAR  │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Use this secret to verify webhook signatures          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Copiar:**
- ✅ Signing secret → `STRIPE_WEBHOOK_SECRET` no `server/.env`

---

## 🧪 6. Testando com Stripe CLI (Local)

### Terminal 1: Stripe CLI
```bash
$ stripe listen --forward-to localhost:4000/api/billing/webhook

⣽ Getting ready...
✔ Ready! Your webhook signing secret is whsec_abc123def456...
  (^) Copy this to your .env as STRIPE_WEBHOOK_SECRET

2026-02-21 10:30:15   --> checkout.session.completed [evt_abc123]
2026-02-21 10:30:16   <-- [200] POST http://localhost:4000/api/billing/webhook
2026-02-21 10:30:17   --> customer.subscription.created [evt_def456]
2026-02-21 10:30:18   <-- [200] POST http://localhost:4000/api/billing/webhook
```

### Terminal 2: Backend Server
```bash
$ cd server && npm run dev

Server running on http://localhost:4000
✅ Stripe initialized
✅ Database connected

[WEBHOOK] checkout.session.completed received
[WEBHOOK] Creating subscription for user 123
[WEBHOOK] Subscription created successfully
```

---

## ✅ Resumo dos IDs necessários

| Variável | Formato | Onde encontrar |
|----------|---------|----------------|
| `STRIPE_SECRET_KEY` | `sk_test_51...` | Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Developers → Webhooks → (endpoint) |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_1...` | Products → AppFinanceiro Pro → Preço mensal |
| `STRIPE_PRICE_PRO_YEARLY` | `price_1...` | Products → AppFinanceiro Pro → Preço anual |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | `price_1...` | Products → AppFinanceiro Enterprise → Preço mensal |
| `STRIPE_PRICE_ENTERPRISE_YEARLY` | `price_1...` | Products → AppFinanceiro Enterprise → Preço anual |

---

## 🎯 Próximo passo

Após coletar todos os IDs:
1. Preencher `server/.env` com os valores
2. Executar `./validate-stripe.sh` para validar
3. Testar checkout localmente
4. Deploy em produção

---

**Última atualização:** 21/02/2026
