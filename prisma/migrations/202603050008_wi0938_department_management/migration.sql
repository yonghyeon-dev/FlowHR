-- WI-0938: Department hierarchy + manager metadata for admin management workspace.
ALTER TABLE "Department"
ADD COLUMN IF NOT EXISTS "parentId" TEXT,
ADD COLUMN IF NOT EXISTS "managerId" TEXT;

CREATE INDEX IF NOT EXISTS "Department_parentId_idx" ON "Department"("parentId");
CREATE INDEX IF NOT EXISTS "Department_managerId_idx" ON "Department"("managerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Department_parentId_fkey'
  ) THEN
    ALTER TABLE "Department"
    ADD CONSTRAINT "Department_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Department"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Department_managerId_fkey'
  ) THEN
    ALTER TABLE "Department"
    ADD CONSTRAINT "Department_managerId_fkey"
    FOREIGN KEY ("managerId") REFERENCES "Employee"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
