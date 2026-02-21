# Etapa 1 — Estratégia e Fundamentos SaaS

## Objetivo
Estabelecer base de produto, negócio e técnica para a migração do app offline para SaaS multi-tenant.

## Escopo desta etapa
- Definir ICP (perfil ideal de cliente) e proposta de valor.
- Definir planos e hipótese de preços.
- Definir KPIs de negócio e produto.
- Definir arquitetura alvo (frontend, API, banco, auth, billing).
- Definir checklist mínimo de LGPD e segurança.

## Entregáveis implementados no projeto
- Configuração de runtime para modo `local` e `saas`.
- Variáveis de ambiente base para API/Auth/Billing.
- Tipos de domínio SaaS (Tenant, Subscription, planos).
- Feature flags por plano para suportar rollout de funcionalidades.

## KPIs iniciais sugeridos
- Ativação: usuário com 1º lançamento em até 24h.
- Retenção: D7 e D30.
- Conversão: Free -> Pro.
- Receita: MRR e churn mensal.
- Operação: tempo médio de resposta de suporte.

## Critérios de aceite da etapa
- Base de configuração pronta para ambientes e modo SaaS.
- Modelo de planos e direitos de uso documentado.
- Backlog das próximas etapas priorizado.
- Nenhuma quebra no funcionamento atual do app local.

## Riscos mapeados
- Subestimar esforço de migração do storage local para nuvem.
- Cobrança sem gestão completa de ciclo de assinatura.
- Falta de auditoria para operações críticas de dados.

## Próxima etapa
Implementar backend inicial multi-tenant + autenticação + banco com migrações.
