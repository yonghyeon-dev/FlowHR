-- WI-0940: position management fields
ALTER TABLE "Position"
ADD COLUMN "title" TEXT,
ADD COLUMN "grade" INTEGER,
ADD COLUMN "description" TEXT;

UPDATE "Position"
SET "title" = "name"
WHERE "title" IS NULL;

ALTER TABLE "Position"
ALTER COLUMN "title" SET NOT NULL;
