-- WI-0116: Add approval stage history table for multi-step routing baseline traceability.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApprovalStageResolution') THEN
    CREATE TYPE "ApprovalStageResolution" AS ENUM (
      'EXPECTED_ROLE',
      'ACTIVE_DELEGATION',
      'PRIVILEGED_BYPASS',
      'DENIED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ApprovalStageHistory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "domain" "ApprovalDomain" NOT NULL,
  "targetEntityType" TEXT NOT NULL,
  "targetEntityId" TEXT NOT NULL,
  "stageIndex" INTEGER NOT NULL DEFAULT 1,
  "stageLabel" TEXT NOT NULL DEFAULT 'policy-gate',
  "requiredRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "fallbackRole" TEXT NOT NULL,
  "matchedTemplateIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "activeDelegationIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "actorRole" TEXT NOT NULL,
  "actorId" TEXT,
  "allowed" BOOLEAN NOT NULL,
  "resolution" "ApprovalStageResolution" NOT NULL,
  "payrollGrossPayKrw" INTEGER,
  "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApprovalStageHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApprovalStageHistory_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization" ("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ApprovalStageHistory_organizationId_domain_evaluatedAt_idx"
  ON "ApprovalStageHistory" ("organizationId", "domain", "evaluatedAt");

CREATE INDEX IF NOT EXISTS "ApprovalStageHistory_targetEntityType_targetEntityId_evaluatedAt_idx"
  ON "ApprovalStageHistory" ("targetEntityType", "targetEntityId", "evaluatedAt");
