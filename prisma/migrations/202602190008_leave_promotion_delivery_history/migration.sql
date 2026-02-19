-- WI-0125: Add annual leave promotion delivery history and per-recipient retry model.

DO $$
BEGIN
  CREATE TYPE "LeavePromotionDeliveryChannel" AS ENUM ('webhook', 'email_template');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LeavePromotionDeliveryStatus" AS ENUM ('dry_run', 'skipped_no_targets', 'dispatched', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LeavePromotionRecipientStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED_NO_EMAIL', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "LeavePromotionDelivery" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "asOf" TIMESTAMP(3) NOT NULL,
  "includeUpcoming" BOOLEAN NOT NULL,
  "dryRun" BOOLEAN NOT NULL,
  "channel" "LeavePromotionDeliveryChannel" NOT NULL,
  "provider" TEXT,
  "status" "LeavePromotionDeliveryStatus" NOT NULL,
  "announcementTitle" TEXT NOT NULL,
  "announcementBody" TEXT NOT NULL,
  "targetCount" INTEGER NOT NULL,
  "recipientCount" INTEGER NOT NULL,
  "missingEmailCount" INTEGER NOT NULL,
  "sentTargetCount" INTEGER NOT NULL,
  "webhookSource" TEXT,
  "emailTemplateSource" TEXT,
  "emailTemplateId" TEXT,
  "dispatchedAt" TIMESTAMP(3),
  "requestedByActorRole" TEXT NOT NULL,
  "requestedByActorId" TEXT,
  "retryOfDeliveryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LeavePromotionDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeavePromotionDeliveryRecipient" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT,
  "remainingDays" DECIMAL(6,2) NOT NULL,
  "grantedDays" DECIMAL(6,2) NOT NULL,
  "usedDays" DECIMAL(6,2) NOT NULL,
  "lastAccrualYear" INTEGER,
  "eligibleNow" BOOLEAN NOT NULL,
  "status" "LeavePromotionRecipientStatus" NOT NULL,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LeavePromotionDeliveryRecipient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeavePromotionDelivery_organizationId_createdAt_idx"
  ON "LeavePromotionDelivery"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeavePromotionDelivery_organizationId_status_createdAt_idx"
  ON "LeavePromotionDelivery"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "LeavePromotionDelivery_organizationId_channel_createdAt_idx"
  ON "LeavePromotionDelivery"("organizationId", "channel", "createdAt");
CREATE INDEX IF NOT EXISTS "LeavePromotionDelivery_retryOfDeliveryId_idx"
  ON "LeavePromotionDelivery"("retryOfDeliveryId");
CREATE INDEX IF NOT EXISTS "LeavePromotionDeliveryRecipient_deliveryId_status_createdAt_idx"
  ON "LeavePromotionDeliveryRecipient"("deliveryId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "LeavePromotionDeliveryRecipient_employeeId_createdAt_idx"
  ON "LeavePromotionDeliveryRecipient"("employeeId", "createdAt");

DO $$
BEGIN
  ALTER TABLE "LeavePromotionDelivery"
    ADD CONSTRAINT "LeavePromotionDelivery_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "LeavePromotionDelivery"
    ADD CONSTRAINT "LeavePromotionDelivery_retryOfDeliveryId_fkey"
    FOREIGN KEY ("retryOfDeliveryId") REFERENCES "LeavePromotionDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "LeavePromotionDeliveryRecipient"
    ADD CONSTRAINT "LeavePromotionDeliveryRecipient_deliveryId_fkey"
    FOREIGN KEY ("deliveryId") REFERENCES "LeavePromotionDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
