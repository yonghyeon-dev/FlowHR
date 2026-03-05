CREATE TABLE IF NOT EXISTS "OnboardingTaskTemplate" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OnboardingTaskTemplate_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OnboardingTaskTemplate_organizationId_fkey'
  ) THEN
    ALTER TABLE "OnboardingTaskTemplate"
      ADD CONSTRAINT "OnboardingTaskTemplate_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingTaskTemplate_organizationId_title_key"
  ON "OnboardingTaskTemplate"("organizationId", "title");

CREATE INDEX IF NOT EXISTS "OnboardingTaskTemplate_organizationId_sortOrder_createdAt_id_idx"
  ON "OnboardingTaskTemplate"("organizationId", "sortOrder", "createdAt", "id");
