# Etapa 1 — Estratégia e fundamentos SaaS

## Objetivo
Estabelecer a base de produto, negócio e técnica para migração do app local-first para SaaS multi-tenant.

## Status
✅ Concluída

## Entregas implementadas
- Definição de arquitetura alvo (frontend, API, banco, autenticação e billing).
- Estrutura inicial de runtime para alternar `local` e `saas`.
- Variáveis de ambiente base para API, autenticação e billing.
- Modelo inicial de planos e feature flags por plano.

## Decisões-chave
- Manter abordagem local-first com evolução incremental para nuvem.
- Priorizar MVP SaaS por blocos (core, migração, billing, extrato e operação).
- Evitar quebra de experiência no modo local durante a transição.

## Próxima etapa
Implementar backend inicial multi-tenant com autenticação e banco relacional.

---

**Última atualização:** 21/02/2026
