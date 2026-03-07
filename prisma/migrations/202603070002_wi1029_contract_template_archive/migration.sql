-- WI-1029: Add contract template archive persistence scaffold.

CREATE TABLE IF NOT EXISTS "ContractTemplate" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ContractTemplate"
  ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "ContractTemplate_organizationId_isArchived_updatedAt_idx"
  ON "ContractTemplate"("organizationId", "isArchived", "updatedAt");

DO $$
BEGIN
  ALTER TABLE "ContractTemplate"
    ADD CONSTRAINT "ContractTemplate_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
