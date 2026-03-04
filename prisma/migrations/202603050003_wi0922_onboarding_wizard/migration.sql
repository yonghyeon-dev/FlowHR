ALTER TABLE "Organization"
ADD COLUMN "businessRegistrationNumber" TEXT,
ADD COLUMN "industry" TEXT,
ADD COLUMN "representativeName" TEXT,
ADD COLUMN "workStartTime" TEXT,
ADD COLUMN "workEndTime" TEXT,
ADD COLUMN "workDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "timezone" TEXT,
ADD COLUMN "isOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;
