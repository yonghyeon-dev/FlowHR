-- CreateTable
CREATE TABLE "OnboardingTaskTemplate" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OnboardingTaskTemplate_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "OnboardingTask" ADD COLUMN "templateId" TEXT;

-- CreateIndex
CREATE INDEX "OnboardingTaskTemplate_organizationId_active_sortOrder_id_idx"
ON "OnboardingTaskTemplate"("organizationId", "active", "sortOrder", "id");

-- CreateIndex
CREATE INDEX "OnboardingTask_templateId_idx" ON "OnboardingTask"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingTask_employeeId_templateId_key"
ON "OnboardingTask"("employeeId", "templateId");

-- AddForeignKey
ALTER TABLE "OnboardingTaskTemplate"
ADD CONSTRAINT "OnboardingTaskTemplate_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTask"
ADD CONSTRAINT "OnboardingTask_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "OnboardingTaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
