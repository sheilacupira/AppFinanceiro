# Etapa 4 — CRUD de transações por tenant + sync local/nuvem

## Objetivo
Permitir persistência de transações no backend multi-tenant e sincronização com o app frontend em modo SaaS.

## Implementação

### Backend
- Novo modelo `FinanceTransaction` no Prisma, isolado por `tenantId`.
- Rotas protegidas por JWT e tenant:
  - `GET /api/transactions`
  - `PUT /api/transactions/:id` (upsert)
  - `DELETE /api/transactions/:id`
- Isolamento de tenant via chave composta `@@id([tenantId, id])`.

### Frontend
- Serviço de sync de transações:
  - `listRemoteTransactions`
  - `upsertRemoteTransaction`
  - `deleteRemoteTransaction`
  - `syncTransactions`
- Integração no `FinanceContext`:
  - ao autenticar em modo SaaS: sincroniza local -> nuvem e atualiza estado local com remoto;
  - em add/update/delete: replica operação também na nuvem.

## Arquivos principais
- `server/prisma/schema.prisma`
- `server/src/routes/transactions.ts`
- `server/src/index.ts`
- `src/lib/transactionSync.ts`
- `src/lib/saasAuthStorage.ts`
- `src/contexts/FinanceContext.tsx`

## Observações
- O app mantém comportamento local-first.
- Se a chamada em nuvem falhar, o dado local é preservado e o erro é logado no console.

## Próxima etapa
Sincronizar também recorrências, categorias e configurações, além de criar fila de retries offline.
