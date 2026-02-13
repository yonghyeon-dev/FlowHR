ALTER TABLE "LeaveBalanceProjection"
  ADD COLUMN IF NOT EXISTS "carryOverDays" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "LeaveBalanceProjection"
  ADD COLUMN IF NOT EXISTS "lastAccrualYear" INTEGER;
