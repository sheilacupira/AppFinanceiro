# ⚡ Início Rápido

Guia curto para subir o projeto no modo que você precisa.

## 1) Rodar apenas o frontend (local-first)

```bash
npm install
npm run dev
```

Acesse em `http://localhost:8080`.

## 2) Rodar frontend + backend (SaaS)

### Terminal A (backend)
```bash
cd server
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

### Terminal B (frontend)
```bash
cd ..
npm install
npm run dev
```

## 3) Build para produção (frontend)

```bash
npm run build
./serve-pwa.sh
```

Use o endereço de rede exibido para instalar em outro dispositivo.

## Variáveis mínimas recomendadas

- Frontend (`.env`):
  - `VITE_API_BASE_URL` (ex: `http://localhost:4000` no modo SaaS)
  - `VITE_STRIPE_PUBLISHABLE_KEY` (para billing real)
  - `VITE_PLUGGY_CLIENT_ID` e `VITE_PLUGGY_CLIENT_SECRET` (Open Finance)

- Backend (`server/.env`):
  - `DATABASE_URL`
  - `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`
  - `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`

## Referências

- `QUICK_DEPLOY.md` para deploy rápido
- `DEPLOYMENT.md` para cenários completos
- `docs/OPEN_FINANCE_SETUP.md` para Pluggy/Open Finance

**Última atualização:** 21/02/2026
