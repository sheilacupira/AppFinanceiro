-- CreateTable
CREATE TABLE "FinanceRecurrence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "source" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "startDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createAsPending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("tenantId", "id"),
    CONSTRAINT "FinanceRecurrence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinanceCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("tenantId", "id"),
    CONSTRAINT "FinanceCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinanceSettings" (
    "tenantId" TEXT NOT NULL PRIMARY KEY,
    "isTither" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinanceSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FinanceRecurrence_tenantId_idx" ON "FinanceRecurrence"("tenantId");

-- CreateIndex
CREATE INDEX "FinanceCategory_tenantId_idx" ON "FinanceCategory"("tenantId");
