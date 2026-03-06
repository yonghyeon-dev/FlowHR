-- WI-1012: Seed statutory maternity/paternity leave policies for existing organizations.

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
  'lp_stat_maternity_' || substr(md5(org."id" || ':maternity'), 1, 20),
  org."id",
  'MATERNITY',
  true,
  'ACTIVE'::"LeavePolicyStatus",
  90,
  0,
  false,
  false,
  30,
  8,
  0,
  90,
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
    AND lower(existing."name") = 'maternity'
)
ON CONFLICT ("id") DO NOTHING;

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
  'lp_stat_paternity_' || substr(md5(org."id" || ':paternity'), 1, 20),
  org."id",
  'PATERNITY',
  true,
  'ACTIVE'::"LeavePolicyStatus",
  10,
  0,
  false,
  false,
  30,
  8,
  0,
  10,
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
    AND lower(existing."name") = 'paternity'
)
ON CONFLICT ("id") DO NOTHING;
