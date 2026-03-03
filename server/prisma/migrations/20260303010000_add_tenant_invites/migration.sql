CREATE TABLE "TenantInvite" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "tenantId"   TEXT NOT NULL,
  "invitedBy"  TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "role"       TEXT NOT NULL DEFAULT 'MEMBER',
  "token"      TEXT NOT NULL,
  "expiresAt"  DATETIME NOT NULL,
  "acceptedAt" DATETIME,
  "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TenantInvite_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TenantInvite_token_key" ON "TenantInvite"("token");
CREATE INDEX "TenantInvite_tenantId_idx" ON "TenantInvite"("tenantId");
CREATE INDEX "TenantInvite_token_idx" ON "TenantInvite"("token");
