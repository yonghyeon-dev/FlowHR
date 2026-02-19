-- WI-0120: Leave policy annual promotion and internal notice flow baseline.
ALTER TABLE "LeavePolicy"
ADD COLUMN IF NOT EXISTS "annualLeavePromotionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "annualLeavePromotionThresholdDays" DECIMAL(6,2) NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS "annualLeavePromotionLeadDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS "annualLeavePromotionMessageTemplate" TEXT;
