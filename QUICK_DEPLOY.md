# 🚀 Deploy Rápido

## Frontend/PWA (modo rápido)

```bash
npm install
npm run build
./serve-pwa.sh
```

Abra o link de rede mostrado no terminal em outro dispositivo e instale o app.

## Full stack (SaaS)

### Backend
```bash
cd server
npm install
cp .env.example .env
npm run prisma:migrate
npm run build
npm run start
```

### Frontend
```bash
cd ..
npm install
npm run build
npm run preview
```

Defina `VITE_API_BASE_URL` apontando para a API publicada.

## Stripe (produção)

- Configurar no backend:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_PRICE_PRO_YEARLY`
  - `STRIPE_PRICE_ENTERPRISE_MONTHLY`
  - `STRIPE_PRICE_ENTERPRISE_YEARLY`

- Configurar no frontend:
  - `VITE_STRIPE_PUBLISHABLE_KEY`

## Open Finance (produção)

- Configurar no frontend:
  - `VITE_PLUGGY_CLIENT_ID`
  - `VITE_PLUGGY_CLIENT_SECRET`

Sem credenciais Pluggy, o app funciona em modo mock para Open Finance.

## Próximo documento

Para estratégias de deploy (Vercel/Netlify/infra própria), use `DEPLOYMENT.md`.

**Última atualização:** 21/02/2026
