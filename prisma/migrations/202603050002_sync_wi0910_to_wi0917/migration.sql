-- CreateEnum
CREATE TYPE "OnboardingTaskStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InsuranceEnrollmentType" AS ENUM ('NPS', 'NHI', 'EI', 'WCI');

-- CreateEnum
CREATE TYPE "InsuranceEnrollmentStatus" AS ENUM ('ENROLLED', 'NOT_ENROLLED', 'PENDING');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "RecruitmentOpening" ADD COLUMN     "hiringManagerId" TEXT;

-- AlterTable
ALTER TABLE "RecruitmentReferral" ADD COLUMN     "stageReason" TEXT;

-- AlterTable
ALTER TABLE "BenefitCatalogItem" ADD COLUMN     "enrollmentEndDate" TEXT,
ADD COLUMN     "enrollmentStartDate" TEXT;

-- CreateTable
CREATE TABLE "OnboardingTask" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "OnboardingTaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceEnrollment" (
    "employeeId" TEXT NOT NULL,
    "type" "InsuranceEnrollmentType" NOT NULL,
    "status" "InsuranceEnrollmentStatus" NOT NULL,
    "enrolledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceEnrollment_pkey" PRIMARY KEY ("employeeId","type")
);

-- CreateIndex
CREATE INDEX "OnboardingTask_employeeId_createdAt_id_idx" ON "OnboardingTask"("employeeId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "InsuranceEnrollment_employeeId_updatedAt_idx" ON "InsuranceEnrollment"("employeeId", "updatedAt");

-- AddForeignKey
ALTER TABLE "OnboardingTask" ADD CONSTRAINT "OnboardingTask_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceEnrollment" ADD CONSTRAINT "InsuranceEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

