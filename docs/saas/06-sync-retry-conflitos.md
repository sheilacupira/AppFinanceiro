# Etapa 6 — Retry offline + resolução de conflitos (MVP)

## Objetivo
Garantir que operações realizadas offline sejam reprocessadas quando a conexão voltar, reduzindo perda de dados no modo SaaS.

## Estratégia aplicada
- **Fila local** em `localStorage` com operações pendentes (upsert/delete).
- **Deduplicação por entidade**: somente a última operação por item é mantida na fila.
- **Reprocessamento automático**:
  - ao autenticar no modo SaaS;
  - a cada 30 segundos;
  - no evento `online` do navegador.

## Regra de conflito (MVP)
- **Última escrita local prevalece**.
- Em erro de rede, a operação é enfileirada.
- Em erro permanente (ex.: regra de negócio no backend), a operação permanece na fila até intervenção manual (não implementada ainda).

## Arquivos principais
- `src/lib/syncQueue.ts`
- `src/contexts/FinanceContext.tsx`

## Próximo passo
- Adicionar painel de conflitos/erros para o usuário.
- Melhorar resolução com timestamps e merge no backend.
