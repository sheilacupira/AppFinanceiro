# Etapa 3 — Integração de autenticação no frontend

## Objetivo
Conectar o app frontend ao backend SaaS para habilitar login/cadastro/sessão no modo SaaS, mantendo compatibilidade total com o modo local.

## Status
✅ Concluída

## Entregas implementadas
- `AuthProvider` global com contexto de autenticação.
- Fluxo completo de sessão (login, cadastro, refresh token, logout, recuperação).
- `AuthPage` para usuários não autenticados em modo SaaS.
- Guard de rota condicional respeitando `isSaasMode`.
- Seção de conta SaaS nas configurações com ação de logout.

## Arquivos principais
- `src/contexts/AuthContext.tsx`
- `src/pages/AuthPage.tsx`
- `src/lib/apiClient.ts`
- `src/pages/Index.tsx`, `SettingsPage.tsx`
- `src/App.tsx`

## Como validar
1. Subir backend (`cd server && npm run dev`).
2. Configurar `.env` na raiz com `VITE_APP_MODE=saas`.
3. Subir frontend (`npm run dev`).
4. Testar cadastro → login → recarregar → logout.

## Próxima etapa
Sincronização de transações por tenant com fallback offline.

---

**Última atualização:** 21/02/2026
