# 📋 Sumário consolidado

**Data de referência:** 21/02/2026

## Visão geral

O AppFinanceiro evoluiu de PWA offline para uma base híbrida:

- **Modo local-first** (frontend funcionando sem backend)
- **Modo SaaS** com backend dedicado (auth, sync e billing)

## O que está pronto

### Frontend/PWA
- Core financeiro completo
- Importação OFX/CSV
- Auto-categorização na importação
- PWA instalável com suporte offline

### Backend SaaS
- Autenticação JWT (access + refresh)
- Rotas de usuário (`/api/me`)
- Rotas de transações e metadados financeiros
- Billing Stripe com checkout, subscription, invoices, portal e webhook

## O que está parcial

- Open Finance/Pluggy: infraestrutura e telas prontas, porém com partes ainda em mock/simulação no fluxo de conexão/sincronização real.

## Operação recomendada

### Uso local
```bash
npm run dev
```

### Uso full stack
```bash
cd server && npm run dev
# em outro terminal na raiz:
npm run dev
```

## Documentação canônica

- `README.md` (visão principal)
- `QUICK_START.md` (subida rápida)
- `DEPLOYMENT.md` (deploy detalhado)
- `PRODUCAO.md` (checklist operacional)
- `docs/OPEN_FINANCE_SETUP.md` (Open Finance)
- `docs/saas/backlog-mvp.md` (roadmap)
