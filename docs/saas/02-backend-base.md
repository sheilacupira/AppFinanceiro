# Etapa 2 — Backend inicial multi-tenant

## Objetivo
Disponibilizar API inicial para autenticação, sessão de usuário e contexto de tenant.

## Status
✅ Concluída

## Entregas implementadas
- Estrutura Node.js + Express + Prisma ORM.
- Modelo de dados multi-tenant (`User`, `Tenant`, `Membership`, `RefreshToken`).
- Endpoints de autenticação (register, login, refresh, logout).
- Endpoint `/api/me` com dados do usuário autenticado.
- Middleware JWT para proteger rotas.

## Arquivos principais
- `server/src/index.ts` (bootstrap da API)
- `server/src/routes/auth.ts`, `me.ts`, `health.ts`
- `server/src/middleware/auth.ts`
- `server/prisma/schema.prisma`

## Como validar localmente
```bash
cd server
cp .env.example .env
npm install
npm run prisma:migrate
npm run dev
```
API disponível em `http://localhost:4000`.

## Próxima etapa
Integrar frontend com autenticação e alternância `local`/`saas`.

---

**Última atualização:** 21/02/2026
