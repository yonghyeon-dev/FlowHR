-- WI-0816: Add benefits persistence tables for catalog/request read model.

DO $$
BEGIN
  CREATE TYPE "BenefitCatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "BenefitRequestStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BenefitCatalogItem" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "annualLimitKrw" INTEGER NOT NULL,
  "status" "BenefitCatalogStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BenefitCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BenefitRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "benefitId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "amountKrw" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "BenefitRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "requestedAt" TIMESTAMP(3) NOT NULL,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByActorId" TEXT,
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BenefitRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BenefitCatalogItem_organizationId_status_updatedAt_idx"
  ON "BenefitCatalogItem"("organizationId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "BenefitCatalogItem_organizationId_updatedAt_idx"
  ON "BenefitCatalogItem"("organizationId", "updatedAt");
CREATE INDEX IF NOT EXISTS "BenefitRequest_organizationId_status_updatedAt_idx"
  ON "BenefitRequest"("organizationId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "BenefitRequest_organizationId_employeeId_updatedAt_idx"
  ON "BenefitRequest"("organizationId", "employeeId", "updatedAt");
CREATE INDEX IF NOT EXISTS "BenefitRequest_benefitId_updatedAt_idx"
  ON "BenefitRequest"("benefitId", "updatedAt");

DO $$
BEGIN
  ALTER TABLE "BenefitCatalogItem"
    ADD CONSTRAINT "BenefitCatalogItem_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "BenefitRequest"
    ADD CONSTRAINT "BenefitRequest_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "BenefitRequest"
    ADD CONSTRAINT "BenefitRequest_benefitId_fkey"
    FOREIGN KEY ("benefitId") REFERENCES "BenefitCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

