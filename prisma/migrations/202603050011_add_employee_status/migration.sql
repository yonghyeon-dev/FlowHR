-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "status" "EmployeeStatus";
UPDATE "Employee"
SET "status" = CASE
  WHEN "active" THEN 'ACTIVE'::"EmployeeStatus"
  ELSE 'ON_LEAVE'::"EmployeeStatus"
END;
ALTER TABLE "Employee" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Employee" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- DropIndex
DROP INDEX IF EXISTS "Employee_organizationId_active_idx";

-- CreateIndex
CREATE INDEX "Employee_organizationId_status_idx" ON "Employee"("organizationId", "status");

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "active";
