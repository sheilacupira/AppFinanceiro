-- AlterTable: add optional phone column to User
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- CreateIndex: ensure uniqueness
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
