-- WI-0755: Add Notice persistence/read-model tables and notification queue.

DO $$
BEGIN
  CREATE TYPE "NoticeAudience" AS ENUM ('all', 'employees', 'admins');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "NoticeNotificationChannel" AS ENUM ('in_app');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "NoticeNotificationState" AS ENUM ('QUEUED', 'DELIVERED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Notice" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "audience" "NoticeAudience" NOT NULL,
  "status" "NoticeStatus" NOT NULL DEFAULT 'DRAFT',
  "publishAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdByActorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NoticeReadReceipt" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "noticeId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NoticeReadReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NoticeNotificationQueue" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "noticeId" TEXT NOT NULL,
  "audience" "NoticeAudience" NOT NULL,
  "channel" "NoticeNotificationChannel" NOT NULL,
  "state" "NoticeNotificationState" NOT NULL DEFAULT 'QUEUED',
  "enqueuedAt" TIMESTAMP(3) NOT NULL,
  "deliveredAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NoticeNotificationQueue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notice_receipt_org_notice_actor_key"
  ON "NoticeReadReceipt"("organizationId", "noticeId", "actorId");

CREATE INDEX IF NOT EXISTS "Notice_organizationId_status_updatedAt_idx"
  ON "Notice"("organizationId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "Notice_organizationId_audience_updatedAt_idx"
  ON "Notice"("organizationId", "audience", "updatedAt");
CREATE INDEX IF NOT EXISTS "NoticeReadReceipt_organizationId_actorId_readAt_idx"
  ON "NoticeReadReceipt"("organizationId", "actorId", "readAt");
CREATE INDEX IF NOT EXISTS "NoticeReadReceipt_noticeId_readAt_idx"
  ON "NoticeReadReceipt"("noticeId", "readAt");
CREATE INDEX IF NOT EXISTS "NoticeNotificationQueue_organizationId_state_enqueuedAt_idx"
  ON "NoticeNotificationQueue"("organizationId", "state", "enqueuedAt");
CREATE INDEX IF NOT EXISTS "NoticeNotificationQueue_noticeId_enqueuedAt_idx"
  ON "NoticeNotificationQueue"("noticeId", "enqueuedAt");

DO $$
BEGIN
  ALTER TABLE "Notice"
    ADD CONSTRAINT "Notice_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "NoticeReadReceipt"
    ADD CONSTRAINT "NoticeReadReceipt_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "NoticeReadReceipt"
    ADD CONSTRAINT "NoticeReadReceipt_noticeId_fkey"
    FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "NoticeNotificationQueue"
    ADD CONSTRAINT "NoticeNotificationQueue_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "NoticeNotificationQueue"
    ADD CONSTRAINT "NoticeNotificationQueue_noticeId_fkey"
    FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
