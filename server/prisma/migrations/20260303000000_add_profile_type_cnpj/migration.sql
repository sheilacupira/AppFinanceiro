-- Add profileType column with default 'personal' for all existing tenants
ALTER TABLE "Tenant" ADD COLUMN "profileType" TEXT NOT NULL DEFAULT 'personal';

-- Add CNPJ and razão social columns (optional)
ALTER TABLE "Tenant" ADD COLUMN "cnpj" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "razaoSocial" TEXT;

-- Backfill: tenants stored with PJ: prefix are business profiles
UPDATE "Tenant" SET "profileType" = 'business' WHERE "name" LIKE 'PJ:%';

-- Clean up legacy prefixes from names (PF: Name → Name, PJ: Name → Name)
UPDATE "Tenant" SET "name" = TRIM(SUBSTR("name", 5)) WHERE "name" LIKE 'PF: %';
UPDATE "Tenant" SET "name" = TRIM(SUBSTR("name", 5)) WHERE "name" LIKE 'PJ: %';
