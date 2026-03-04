-- WI-0908: Add department-targeted audience field to notices.
ALTER TABLE "Notice"
ADD COLUMN IF NOT EXISTS "targetDepartmentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];