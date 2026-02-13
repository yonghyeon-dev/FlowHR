CREATE TABLE IF NOT EXISTS "DeductionProfile" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "mode" TEXT NOT NULL,
  "withholdingRate" DECIMAL(5, 4),
  "socialInsuranceRate" DECIMAL(5, 4),
  "fixedOtherDeductionKrw" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeductionProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PayrollRun"
  ADD COLUMN IF NOT EXISTS "deductionProfileId" TEXT;

ALTER TABLE "PayrollRun"
  ADD COLUMN IF NOT EXISTS "deductionProfileVersion" INTEGER;
