-- Migration: Substituir Stripe por Mercado Pago
-- Remove colunas Stripe (se existirem) e adiciona colunas MP

-- Adicionar novas colunas MP (nullable para não quebrar rows existentes)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "mpCustomerId"     TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "mpSubscriptionId" TEXT;

-- Remover colunas Stripe (se existirem)
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "stripeSubscriptionId";
