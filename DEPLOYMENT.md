# 🚀 Guia de Deploy

**Última atualização:** 21/02/2026

Este projeto suporta dois cenários de deploy:

1. **Frontend/PWA standalone** (local-first)
2. **Full stack SaaS** (frontend + backend + banco + Stripe)

---

## 1) Frontend/PWA standalone

### Build e execução local

```bash
npm install
npm run build
npm run serve
```

Ou:

```bash
./serve-pwa.sh
```

### Hospedagem estática

- Vercel
- Netlify
- Cloudflare Pages
- Qualquer servidor de arquivos estáticos

Variável relevante:
- `VITE_API_BASE_URL` vazio (ou omitido) para operação local-only

---

## 2) Full stack SaaS

### Backend (Node + Prisma)

```bash
cd server
npm install
cp .env.example .env
npm run prisma:migrate
npm run build
npm run start
```

`server/.env` mínimo:
- `PORT`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Para billing Stripe:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `STRIPE_PRICE_ENTERPRISE_YEARLY`

📘 **Guias de configuração Stripe:**
- [Criar Price IDs no Stripe Dashboard](./docs/STRIPE_PRICING_SETUP.md)
- [Quick Reference Stripe](./docs/STRIPE_QUICK_REFERENCE.md)

### Frontend

```bash
cd ..
npm install
npm run build
npm run preview
```

`.env` recomendado no frontend:
- `VITE_API_BASE_URL` (URL pública da API)
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_PLUGGY_CLIENT_ID`
- `VITE_PLUGGY_CLIENT_SECRET`

---

## Stripe webhook

Endpoint: `POST /api/billing/webhook`

- Publicar endpoint HTTPS
- Configurar segredo em `STRIPE_WEBHOOK_SECRET`
- Garantir que eventos de checkout/subscription sejam entregues para a API

---

## Open Finance (Pluggy)

O app já possui integração e fallback mock. Em produção:

- Defina credenciais Pluggy no frontend
- Revise `docs/OPEN_FINANCE_SETUP.md`
- Considere mover autenticação Pluggy para backend por segurança

---

## Checklist final

- Frontend build ok (`npm run build`)
- Backend build ok (`cd server && npm run build`)
- Migrações aplicadas (`npm run prisma:migrate`)
- CORS apontando para domínio correto
- Variáveis Stripe preenchidas
- Teste de login, sync e assinatura realizado
