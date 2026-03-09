ALTER TABLE "Organization"
ADD COLUMN "approvalEscalationDefaultStalledHoursMin" INTEGER,
ADD COLUMN "approvalEscalationDefaultLimit" INTEGER,
ADD COLUMN "approvalEscalationDefaultNotificationChannel" TEXT;
