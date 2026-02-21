# Etapa 5 — Sync de recorrências, categorias e configurações

## Objetivo
Completar a sincronização SaaS dos dados financeiros além de transações.

## Entregas

### Backend
- Modelos multi-tenant adicionados:
  - `FinanceRecurrence`
  - `FinanceCategory`
  - `FinanceSettings`
- Rotas protegidas por tenant:
  - `GET /api/finance-meta`
  - `PUT /api/recurrences/:id`
  - `DELETE /api/recurrences/:id`
  - `PUT /api/categories/:id`
  - `DELETE /api/categories/:id`
  - `PUT /api/settings`

### Frontend
- Serviço de sync para metadados financeiros:
  - `src/lib/financeMetaSync.ts`
- Integração no `FinanceContext` para:
  - sincronizar no login SaaS
  - upsert/delete remoto em mudanças locais de recorrências/categorias
  - persistência remota de configurações

## Observações
- Fluxo continua local-first.
- Em falhas de rede, dados locais são preservados e erro é registrado no console.

## Próxima etapa sugerida
- Fila de retries offline + resolução de conflitos de sincronização.
- Em seguida, iniciar módulo de importação de extrato CSV/OFX.
