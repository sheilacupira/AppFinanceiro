-- Migration: admin_affiliates
-- Adds isBlocked, referralCode to User; creates Affiliate and AffiliateReferral tables

-- User additions
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- Affiliate table
CREATE TABLE IF NOT EXISTS "Affiliate" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT,
    "name"           TEXT NOT NULL,
    "email"          TEXT NOT NULL,
    "code"           TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "status"         TEXT NOT NULL DEFAULT 'active',
    "totalEarned"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaid"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Affiliate_userId_key"  ON "Affiliate"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Affiliate_email_key"   ON "Affiliate"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Affiliate_code_key"    ON "Affiliate"("code");

-- AffiliateReferral table
CREATE TABLE IF NOT EXISTS "AffiliateReferral" (
    "id"               TEXT NOT NULL,
    "affiliateId"      TEXT NOT NULL,
    "referredEmail"    TEXT NOT NULL,
    "referredUserId"   TEXT,
    "tenantId"         TEXT,
    "plan"             TEXT,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status"           TEXT NOT NULL DEFAULT 'pending',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt"      TIMESTAMP(3),
    "paidAt"           TIMESTAMP(3),

    CONSTRAINT "AffiliateReferral_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AffiliateReferral_affiliateId_idx" ON "AffiliateReferral"("affiliateId");

-- Foreign keys (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Affiliate_userId_fkey') THEN
    ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateReferral_affiliateId_fkey') THEN
    ALTER TABLE "AffiliateReferral" ADD CONSTRAINT "AffiliateReferral_affiliateId_fkey"
      FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
