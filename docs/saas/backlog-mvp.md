# Backlog MVP SaaS (priorizado)

## Bloco A — Core SaaS
1. API base (health, auth, me)
2. Banco relacional com modelagem multi-tenant
3. Cadastro/login/reset de senha
4. Sessão segura e refresh token
5. CRUD de transações por tenant

## Bloco B — Migração do app atual
1. Adaptador para sync local <-> nuvem
2. Versionamento de schema de dados
3. Migração assistida de dados locais
4. Resolução de conflitos de sincronização

## Bloco C — Billing
1. Planos Free/Pro
2. Assinatura + trial
3. Webhooks de cobrança
4. Bloqueios por feature/limite

## Bloco D — Extrato bancário
1. Upload de arquivo CSV/OFX
2. Parser e normalização
3. Deduplicação e conciliação
4. Preview com confirmação antes de importar

## Bloco E — Operação e compliance
1. Logs e monitoramento
2. Auditoria de eventos críticos
3. Política LGPD (retenção/exclusão)
4. Runbook de incidentes
