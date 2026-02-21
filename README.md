# 💰 AppFinanceiro

Aplicação financeira com arquitetura **local-first** e suporte a **SaaS opcional**.

## Status atual (21/02/2026)

### ✅ Concluído
- PWA offline (cache, instalação, uso local)
- CRUD financeiro completo (transações, categorias, recorrências, configurações)
- Importação de extrato OFX/CSV + deduplicação
- Auto-categorização de lançamentos importados
- Backend SaaS base (Auth, Me, Transactions, Finance Meta)
- Billing com Stripe (checkout, subscription, invoices, portal, webhook)

### 🟡 Parcial / em evolução
- Open Finance (Pluggy): estrutura pronta + modo mock; widget/conexão real e sync automático ainda em finalização

## Modos de execução

### 1) Local-only (rápido)
Sem backend, foco em uso offline no navegador/PWA.

```bash
npm install
npm run dev
```

### 2) Full stack (SaaS)
Frontend + backend + banco + billing.

```bash
# frontend
npm install

# backend
cd server
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev

# em outro terminal (na raiz)
npm run dev
```

## Variáveis de ambiente

- Frontend: copiar `.env.example` para `.env`
- Backend: copiar `server/.env.example` para `server/.env`

Principais variáveis:
- Frontend: `VITE_API_BASE_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_PLUGGY_CLIENT_ID`, `VITE_PLUGGY_CLIENT_SECRET`
- Backend: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Scripts úteis (raiz)

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run serve
npm run deploy
```

## Documentação

- `QUICK_START.md` → onboarding rápido
- `QUICK_DEPLOY.md` → deploy rápido
- `DEPLOYMENT.md` → deploy detalhado (frontend + full stack)
- `PRODUCAO.md` → checklist de produção
- `PWA_SETUP.md` → instalação como app (PWA)
- `docs/OPEN_FINANCE_SETUP.md` → setup do Pluggy/Open Finance
- `docs/saas/` → roadmap e etapas SaaS

### Configuração Stripe (Billing)

- `docs/STRIPE_WORKFLOW.md` → **workflow completo do início ao fim** ⭐
- `docs/STRIPE_PRICING_SETUP.md` → guia detalhado para criar Price IDs
- `docs/STRIPE_QUICK_REFERENCE.md` → referência rápida e checklist
- `STRIPE_CONFIG_TEMPLATE.env` → template de configuração
- `./validate-stripe.sh` → script de validação de configs

## Observação importante

O projeto segue funcionando muito bem em modo offline/local. Recursos SaaS (auth remoto, billing real, sync via backend) dependem de configuração de ambiente e backend ativo.
