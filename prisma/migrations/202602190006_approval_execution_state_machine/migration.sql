-- WI-0118: Add approval execution state machine tables for staged approval actions.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApprovalExecutionState') THEN
    CREATE TYPE "ApprovalExecutionState" AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApprovalExecutionAction') THEN
    CREATE TYPE "ApprovalExecutionAction" AS ENUM (
      'APPROVE',
      'REJECT'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ApprovalExecution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "domain" "ApprovalDomain" NOT NULL,
  "targetEntityType" TEXT NOT NULL,
  "targetEntityId" TEXT NOT NULL,
  "templateId" TEXT,
  "state" "ApprovalExecutionState" NOT NULL DEFAULT 'PENDING',
  "totalStages" INTEGER NOT NULL,
  "currentStageIndex" INTEGER NOT NULL DEFAULT 1,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApprovalExecution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApprovalExecution_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization" ("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "approval_execution_target_key"
  ON "ApprovalExecution" ("organizationId", "domain", "targetEntityType", "targetEntityId");

CREATE INDEX IF NOT EXISTS "ApprovalExecution_organizationId_state_updatedAt_idx"
  ON "ApprovalExecution" ("organizationId", "state", "updatedAt");

CREATE TABLE IF NOT EXISTS "ApprovalExecutionActionLog" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "stageIndex" INTEGER NOT NULL,
  "action" "ApprovalExecutionAction" NOT NULL,
  "actorRole" TEXT NOT NULL,
  "actorId" TEXT,
  "resolution" "ApprovalStageResolution" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApprovalExecutionActionLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApprovalExecutionActionLog_executionId_fkey"
    FOREIGN KEY ("executionId")
    REFERENCES "ApprovalExecution" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ApprovalExecutionActionLog_executionId_stageIndex_action_createdAt_idx"
  ON "ApprovalExecutionActionLog" ("executionId", "stageIndex", "action", "createdAt");

CREATE INDEX IF NOT EXISTS "ApprovalExecutionActionLog_executionId_actorId_stageIndex_action_idx"
  ON "ApprovalExecutionActionLog" ("executionId", "actorId", "stageIndex", "action");
