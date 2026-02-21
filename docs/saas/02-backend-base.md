# Etapa 2 — Backend inicial multi-tenant

## Objetivo
Disponibilizar API inicial para autenticação, sessão e contexto de tenant.

## Stack adotada
- Node.js + Express
- Prisma ORM + SQLite (desenvolvimento local)
- JWT (access + refresh token)

## Estrutura criada
- `server/src/index.ts` — bootstrap da API
- `server/src/routes/health.ts` — healthcheck
- `server/src/routes/auth.ts` — register/login/refresh/logout
- `server/src/routes/me.ts` — dados do usuário autenticado
- `server/src/middleware/auth.ts` — middleware Bearer token
- `server/prisma/schema.prisma` — User, Tenant, Membership, RefreshToken

## Endpoints disponíveis
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me`

## Como rodar localmente
1. `cd server`
2. `cp .env.example .env`
3. `npm install`
4. `npm run prisma:migrate -- --name init`
5. `npm run dev`

API em: `http://localhost:4000`

## Próximo passo (Etapa 3)
Integrar frontend com autenticação e troca de modo `local`/`saas`.
