# Etapa 6 — Retry offline e resolução de conflitos (MVP)

## Objetivo
Garantir que operações realizadas offline sejam reprocessadas automaticamente quando a conexão retornar.

## Status
✅ Concluída (MVP)

## Entregas implementadas
- Fila local (`syncQueue.ts`) em `localStorage` com operações pendentes.
- Deduplicação: última operação por item prevalece.
- Reprocessamento automático:
  - Ao autenticar no modo SaaS.
  - A cada 30 segundos.
  - No evento `online` do navegador.

## Regra de conflito (MVP)
- Última escrita local prevalece.
- Erros de rede enfileiram operação.
- Erros permanentes mantêm operação na fila (sem painel de resolução ainda).

## Arquivos principais
- `src/lib/syncQueue.ts`
- `src/contexts/FinanceContext.tsx`

## Próxima etapa
Painel de conflitos para usuário e merge baseado em timestamps no backend.

---

**Última atualização:** 21/02/2026
