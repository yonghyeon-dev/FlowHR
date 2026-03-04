-- WI-0926: In-app notification center read model.

CREATE TABLE IF NOT EXISTS "InAppNotification" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),

  CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InAppNotification_organizationId_recipientId_createdAt_idx"
  ON "InAppNotification"("organizationId", "recipientId", "createdAt");

CREATE INDEX IF NOT EXISTS "InAppNotification_organizationId_recipientId_isRead_createdAt_idx"
  ON "InAppNotification"("organizationId", "recipientId", "isRead", "createdAt");

DO $$
BEGIN
  ALTER TABLE "InAppNotification"
    ADD CONSTRAINT "InAppNotification_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
