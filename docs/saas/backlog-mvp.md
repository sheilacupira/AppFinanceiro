# Backlog MVP — Blocos de Priorização

Este documento organiza as funcionalidades pendentes em blocos por prioridade. Os itens concluídos foram marcados como ✅.

---

## Bloco A — Core SaaS

- ✅ API base (health, auth, me)
- ✅ Banco relacional com modelagem multi-tenant
- ✅ Cadastro/login/reset de senha
- ✅ Sessão segura e refresh token
- ✅ CRUD de transações por tenant

**Status:** 100% concluído

---

## Bloco B — Migração do app atual

- ✅ Adaptador para sync local <-> nuvem
- ✅ Versionamento de schema de dados
- ✅ Migração assistida de dados locais
- ✅ Resolução de conflitos de sincronização (MVP: last-write-wins)

**Status:** 100% concluído (MVP)

---

## Bloco C — Billing

- ✅ Planos Free/Pro
- ✅ Assinatura + trial
- ✅ Webhooks de cobrança
- ✅ Bloqueios por feature/limite

**Status:** 100% concluído

---

## Bloco D — Extrato bancário

- ✅ Upload de arquivo CSV/OFX
- ✅ Parser e normalização
- ✅ Deduplicação e conciliação
- ✅ Preview com confirmação antes de importar
- ✅ Auto-categorização com fuzzy matching

**Status:** 100% concluído

---

## Bloco E — Operação e compliance

- ❌ Logs e monitoramento
- ❌ Auditoria de eventos críticos
- ❌ Política LGPD (retenção/exclusão)
- ❌ Runbook de incidentes

**Status:** Pendente

---

## Observações

- A maioria dos blocos foi concluída durante as etapas 1–7b.
- Bloco E (Operação e compliance) é necessário para produção, mas não bloqueia o MVP funcional.

---

**Última atualização:** 21/02/2026
