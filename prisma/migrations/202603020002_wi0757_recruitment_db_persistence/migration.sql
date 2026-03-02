-- WI-0757: Add recruitment persistence tables for openings/referrals.

DO $$
BEGIN
  CREATE TYPE "RecruitmentOpeningStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RecruitmentReferralStage" AS ENUM (
    'SUBMITTED',
    'SCREENING',
    'INTERVIEW',
    'OFFER',
    'HIRED',
    'REJECTED',
    'WITHDRAWN'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "RecruitmentOpening" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "employmentType" TEXT NOT NULL,
  "status" "RecruitmentOpeningStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RecruitmentOpening_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RecruitmentReferral" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "openingId" TEXT NOT NULL,
  "candidateName" TEXT NOT NULL,
  "candidateEmail" TEXT NOT NULL,
  "referrerEmployeeId" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "stage" "RecruitmentReferralStage" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RecruitmentReferral_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RecruitmentOpening_organizationId_status_updatedAt_idx"
  ON "RecruitmentOpening"("organizationId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "RecruitmentReferral_organizationId_stage_updatedAt_idx"
  ON "RecruitmentReferral"("organizationId", "stage", "updatedAt");
CREATE INDEX IF NOT EXISTS "RecruitmentReferral_organizationId_referrerEmployeeId_updatedAt_idx"
  ON "RecruitmentReferral"("organizationId", "referrerEmployeeId", "updatedAt");
CREATE INDEX IF NOT EXISTS "RecruitmentReferral_openingId_updatedAt_idx"
  ON "RecruitmentReferral"("openingId", "updatedAt");

DO $$
BEGIN
  ALTER TABLE "RecruitmentOpening"
    ADD CONSTRAINT "RecruitmentOpening_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "RecruitmentReferral"
    ADD CONSTRAINT "RecruitmentReferral_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "RecruitmentReferral"
    ADD CONSTRAINT "RecruitmentReferral_openingId_fkey"
    FOREIGN KEY ("openingId") REFERENCES "RecruitmentOpening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
