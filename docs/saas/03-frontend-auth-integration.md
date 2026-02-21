# Etapa 3 — Integração de autenticação no frontend

## Objetivo
Conectar o app frontend ao backend SaaS para habilitar login/cadastro/sessão no modo `saas`, mantendo compatibilidade com modo `local`.

## Implementações realizadas
- `AuthProvider` global no app.
- Fluxo de sessão com:
  - login
  - cadastro
  - refresh token
  - logout
  - recuperação de sessão ao abrir o app
- `AuthPage` (login/cadastro) para usuários não autenticados no modo SaaS.
- Guard de rota na página inicial (`Index`) respeitando `isSaasMode`.
- Bloco de conta SaaS nas configurações com ação de logout.

## Arquivos principais
- `src/contexts/AuthContext.tsx`
- `src/pages/AuthPage.tsx`
- `src/lib/apiClient.ts`
- `src/pages/Index.tsx`
- `src/pages/SettingsPage.tsx`
- `src/App.tsx`

## Como testar
1. Backend:
   - `cd server`
   - `cp .env.example .env`
   - `npm install`
   - `npm run prisma:migrate -- --name init`
   - `npm run dev`
2. Frontend:
   - no arquivo `.env` da raiz, configure `VITE_APP_MODE=saas`
   - opcional: `VITE_API_BASE_URL=http://localhost:4000`
   - `npm run dev`
3. Acesse o app e valide:
   - cadastro
   - login
   - recarregar página mantendo sessão
   - logout em Configurações

## Próxima etapa
Integrar dados financeiros ao backend (sincronização de transações por tenant), mantendo fallback offline.
