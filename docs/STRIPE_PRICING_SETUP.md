# Guia: Configurar Price IDs no Stripe Dashboard

Este guia ensina como criar Products e Prices no Stripe Dashboard e configurá-los no backend do AppFinanceiro.

---

## 📋 Pré-requisitos

- Conta Stripe criada ([stripe.com](https://stripe.com))
- Chaves de API (Secret Key) disponíveis
- Valores dos planos definidos (conforme `src/lib/plans.ts`)

---

## 🎯 Planos a criar

| Plano         | Mensal    | Anual       |
|---------------|-----------|-------------|
| **Pro**       | R$ 29,90  | R$ 299,00   |
| **Enterprise**| R$ 99,90  | R$ 999,00   |

---

## 🛠️ Passo a passo

### 1. Acesse o Stripe Dashboard

1. Faça login em [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Importante**: certifique-se de estar no ambiente correto
   - **Test Mode** (toggle no canto superior direito) para testes
   - **Live Mode** para produção

---

### 2. Crie o Product "Plano Pro"

1. No menu lateral, vá em **Products** → **+ Add product**

2. Preencha:
   - **Name**: `AppFinanceiro Pro`
   - **Description**: `Plano Pro para profissionais e pequenas empresas`
   - **Statement descriptor** (opcional): `APPFIN PRO`

3. **NÃO clique em Save ainda** — vamos adicionar os preços primeiro

---

### 3. Adicione os Prices do Plano Pro

#### 3.1 Preço Mensal

1. Em **Pricing**, clique em **Add another price**
2. Configure:
   - **Price**: `R$ 29,90` (ou `29.90` BRL)
   - **Billing period**: `Monthly`
   - **Currency**: `BRL`
   - **Price description** (opcional): `Mensal`

#### 3.2 Preço Anual

1. Clique em **Add another price** novamente
2. Configure:
   - **Price**: `R$ 299,00` (ou `299.00` BRL)
   - **Billing period**: `Yearly`
   - **Currency**: `BRL`
   - **Price description** (opcional): `Anual (economize 17%)`

3. Clique em **Save product**

---

### 4. Copie os Price IDs do Plano Pro

1. Na página do produto "AppFinanceiro Pro", você verá a lista de preços
2. Para cada preço, clique nos **3 pontinhos** → **Copy price ID**

Os IDs terão formato: `price_1AbcDefGhiJklMno...`

**Exemplo:**
```
Mensal:  price_1NXZabcdefGHIJKL
Anual:   price_1NXZxyzdefABCDEF
```

✏️ **Anote esses IDs** — você vai usá-los no `.env` do backend.

---

### 5. Repita para o Product "Plano Enterprise"

1. Vá em **Products** → **+ Add product**

2. Preencha:
   - **Name**: `AppFinanceiro Enterprise`
   - **Description**: `Plano Enterprise para empresas e gestão avançada`
   - **Statement descriptor**: `APPFIN ENT`

3. Adicione os preços:
   - **Mensal**: R$ 99,90 BRL, billing period = Monthly
   - **Anual**: R$ 999,00 BRL, billing period = Yearly

4. **Salve** e copie os **Price IDs**:
   - Mensal: `price_1...`
   - Anual: `price_1...`

---

## 🔧 Configurar no Backend

### 6. Edite o arquivo `.env` do servidor

Abra `server/.env` (se não existir, copie de `server/.env.example`):

```bash
cd server
cp .env.example .env
nano .env  # ou vim, ou seu editor favorito
```

### 7. Preencha os Price IDs

```dotenv
# Stripe Billing
STRIPE_SECRET_KEY=sk_test_51...  # Ou sk_live para produção
STRIPE_WEBHOOK_SECRET=whsec_...   # (configurar webhooks depois)

# Price IDs copiados do Stripe Dashboard
STRIPE_PRICE_PRO_MONTHLY=price_1NXZabcdefGHIJKL
STRIPE_PRICE_PRO_YEARLY=price_1NXZxyzdefABCDEF
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1NXZ123456ABCDEF
STRIPE_PRICE_ENTERPRISE_YEARLY=price_1NXZ789012GHIJKL

BILLING_PORTAL_RETURN_URL=http://localhost:8080/config
```

**Salve o arquivo.**

---

## ✅ Validar configuração

### 8. Teste no ambiente local

```bash
# No terminal do servidor
cd server
npm run dev
```

### 9. Teste no frontend

1. Inicie o frontend: `npm run dev`
2. Acesse **Configurações** → **Planos de Assinatura**
3. Clique em **Fazer Upgrade** no plano Pro
4. Você deve ser redirecionado para o **Stripe Checkout** (ou simular localmente se não estiver em produção)

---

## 🔍 Verificar Price IDs no código

O backend mapeia os Price IDs via `server/src/lib/stripe.ts`:

```typescript
export const getPriceId = (planId: string, interval: 'month' | 'year'): string | null => {
  if (planId === 'pro') {
    return interval === 'month' 
      ? env.STRIPE_PRICE_PRO_MONTHLY 
      : env.STRIPE_PRICE_PRO_YEARLY;
  }
  if (planId === 'enterprise') {
    return interval === 'month' 
      ? env.STRIPE_PRICE_ENTERPRISE_MONTHLY 
      : env.STRIPE_PRICE_ENTERPRISE_YEARLY;
  }
  return null;
};
```

---

## 🚨 Problemas comuns

### Erro: "Price ID not found"
- Verifique se os IDs estão corretos e sem espaços extras
- Certifique-se de estar usando keys do mesmo ambiente (test ou live)

### Erro: "Currency mismatch"
- Os preços devem estar em **BRL** (reais)
- No Stripe Dashboard, edite o preço se necessário

### Erro: "Invalid API key"
- Verifique se `STRIPE_SECRET_KEY` está preenchida
- Keys de test começam com `sk_test_`
- Keys de produção começam com `sk_live_`

---

## 📚 Próximos passos

1. ✅ Price IDs configurados
2. [ ] Configurar Webhook do Stripe (ver `docs/STRIPE_WEBHOOK_SETUP.md`)
3. [ ] Testar fluxo completo de checkout
4. [ ] Testar cancelamento e reativação de assinatura
5. [ ] Configurar Customer Portal do Stripe

---

## 🔗 Links úteis

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
- [Stripe Products](https://dashboard.stripe.com/products)
- [Stripe Prices API](https://stripe.com/docs/api/prices)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)

---

**Última atualização:** 21/02/2026
