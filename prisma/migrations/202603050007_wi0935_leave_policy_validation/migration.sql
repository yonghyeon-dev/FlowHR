-- WI-0935: Leave policy advanced validation (statutory protection + usage check).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LeavePolicyStatus'
      AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "LeavePolicyStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
  END IF;
END $$;

ALTER TABLE "LeavePolicy"
  ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Default Leave Policy',
  ADD COLUMN IF NOT EXISTS "isStatutory" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "status" "LeavePolicyStatus" NOT NULL DEFAULT 'ACTIVE';

DROP INDEX IF EXISTS "LeavePolicy_organizationId_key";

CREATE INDEX IF NOT EXISTS "LeavePolicy_organizationId_status_isStatutory_updatedAt_idx"
  ON "LeavePolicy"("organizationId", "status", "isStatutory", "updatedAt");

CREATE INDEX IF NOT EXISTS "LeavePolicy_organizationId_isStatutory_updatedAt_idx"
  ON "LeavePolicy"("organizationId", "isStatutory", "updatedAt");

ALTER TABLE "LeaveRequest"
  ADD COLUMN IF NOT EXISTS "policyId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'LeaveRequest_policyId_fkey'
      AND table_name = 'LeaveRequest'
  ) THEN
    ALTER TABLE "LeaveRequest"
      ADD CONSTRAINT "LeaveRequest_policyId_fkey"
      FOREIGN KEY ("policyId")
      REFERENCES "LeavePolicy"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "LeaveRequest_policyId_state_startDate_endDate_idx"
  ON "LeaveRequest"("policyId", "state", "startDate", "endDate");

-- Seed statutory defaults for existing organizations (idempotent).
INSERT INTO "LeavePolicy" (
  "id",
  "organizationId",
  "name",
  "isStatutory",
  "status",
  "annualGrantDays",
  "carryOverCapDays",
  "allowHalfDay",
  "allowHourly",
  "hourlyIncrementMinutes",
  "maxHoursPerRequest",
  "minNoticeDays",
  "maxConsecutiveDays",
  "annualLeavePromotionEnabled",
  "annualLeavePromotionThresholdDays",
  "annualLeavePromotionLeadDays",
  "annualLeavePromotionMessageTemplate",
  "createdAt",
  "updatedAt"
)
SELECT
  'lp_stat_annual_' || substr(md5(org."id" || ':annual'), 1, 20),
  org."id",
  'Annual Leave',
  true,
  'ACTIVE'::"LeavePolicyStatus",
  15,
  5,
  true,
  true,
  30,
  8,
  0,
  NULL,
  false,
  5,
  30,
  NULL,
  NOW(),
  NOW()
FROM "Organization" AS org
WHERE NOT EXISTS (
  SELECT 1
  FROM "LeavePolicy" AS existing
  WHERE existing."organizationId" = org."id"
    AND existing."isStatutory" = true
    AND existing."status" = 'ACTIVE'
    AND lower(existing."name") = 'annual leave'
);

INSERT INTO "LeavePolicy" (
  "id",
  "organizationId",
  "name",
  "isStatutory",
  "status",
  "annualGrantDays",
  "carryOverCapDays",
  "allowHalfDay",
  "allowHourly",
  "hourlyIncrementMinutes",
  "maxHoursPerRequest",
  "minNoticeDays",
  "maxConsecutiveDays",
  "annualLeavePromotionEnabled",
  "annualLeavePromotionThresholdDays",
  "annualLeavePromotionLeadDays",
  "annualLeavePromotionMessageTemplate",
  "createdAt",
  "updatedAt"
)
SELECT
  'lp_stat_sick_' || substr(md5(org."id" || ':sick'), 1, 20),
  org."id",
  'Sick Leave',
  true,
  'ACTIVE'::"LeavePolicyStatus",
  15,
  5,
  true,
  true,
  30,
  8,
  0,
  NULL,
  false,
  5,
  30,
  NULL,
  NOW(),
  NOW()
FROM "Organization" AS org
WHERE NOT EXISTS (
  SELECT 1
  FROM "LeavePolicy" AS existing
  WHERE existing."organizationId" = org."id"
    AND existing."isStatutory" = true
    AND existing."status" = 'ACTIVE'
    AND lower(existing."name") = 'sick leave'
);