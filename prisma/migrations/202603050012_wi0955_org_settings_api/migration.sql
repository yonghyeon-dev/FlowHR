-- CreateEnum
CREATE TYPE "PayPeriod" AS ENUM ('MONTHLY', 'BIWEEKLY');

-- AlterTable
ALTER TABLE "Organization"
ADD COLUMN "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "standardWorkHoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 8,
ADD COLUMN "standardWorkDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "overtimeThresholdHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
ADD COLUMN "payPeriod" "PayPeriod" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'KRW';

-- BackfillFromLegacyColumns
UPDATE "Organization"
SET
  "fiscalYearStartMonth" = CASE
    WHEN "fiscalYearStart" ~ '^[0-9]{2}-[0-9]{2}$' THEN CAST(SUBSTRING("fiscalYearStart" FROM 1 FOR 2) AS INTEGER)
    ELSE 1
  END,
  "standardWorkHoursPerDay" = "workHoursPerDay",
  "overtimeThresholdHours" = "overtimeThreshold";