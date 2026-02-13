DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LeaveType'
      AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'UNPAID');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LeaveRequestState'
      AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "LeaveRequestState" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LeaveDecisionAction'
      AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "LeaveDecisionAction" AS ENUM ('APPROVED', 'REJECTED', 'CANCELED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "LeaveRequest" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "leaveType" "LeaveType" NOT NULL DEFAULT 'ANNUAL',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "days" INTEGER NOT NULL,
  "reason" TEXT,
  "state" "LeaveRequestState" NOT NULL DEFAULT 'PENDING',
  "decisionReason" TEXT,
  "approvedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "canceledAt" TIMESTAMP(3),
  "canceledBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeaveApproval" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "action" "LeaveDecisionAction" NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeaveApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeaveBalanceProjection" (
  "employeeId" TEXT NOT NULL,
  "grantedDays" INTEGER NOT NULL DEFAULT 15,
  "usedDays" INTEGER NOT NULL DEFAULT 0,
  "remainingDays" INTEGER NOT NULL DEFAULT 15,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeaveBalanceProjection_pkey" PRIMARY KEY ("employeeId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'LeaveApproval_requestId_fkey'
      AND table_name = 'LeaveApproval'
  ) THEN
    ALTER TABLE "LeaveApproval"
      ADD CONSTRAINT "LeaveApproval_requestId_fkey"
      FOREIGN KEY ("requestId")
      REFERENCES "LeaveRequest"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "LeaveRequest_employeeId_state_startDate_endDate_idx"
  ON "LeaveRequest"("employeeId", "state", "startDate", "endDate");

CREATE INDEX IF NOT EXISTS "LeaveApproval_requestId_createdAt_idx"
  ON "LeaveApproval"("requestId", "createdAt");
