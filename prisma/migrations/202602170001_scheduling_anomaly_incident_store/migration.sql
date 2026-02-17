-- WI-0079: Scheduling anomaly incident durable store

-- CreateEnum
CREATE TYPE "ScheduleAnomalyIncidentState" AS ENUM ('ACKNOWLEDGED', 'ASSIGNED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ScheduleAnomalyIncidentResolutionCode" AS ENUM (
  'FALSE_POSITIVE',
  'ATTENDANCE_CORRECTED',
  'MANUAL_CONFIRMED',
  'OTHER'
);

-- CreateTable
CREATE TABLE "ScheduleAnomalyIncident" (
  "incidentId" TEXT NOT NULL,
  "organizationId" TEXT,
  "state" "ScheduleAnomalyIncidentState" NOT NULL,
  "assigneeId" TEXT,
  "resolutionCode" "ScheduleAnomalyIncidentResolutionCode",
  "note" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedByActorId" TEXT,
  "updatedByActorRole" TEXT NOT NULL,
  "lastEscalationRequestedAt" TIMESTAMP(3),
  "history" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rowUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleAnomalyIncident_pkey" PRIMARY KEY ("incidentId")
);

-- CreateIndex
CREATE INDEX "ScheduleAnomalyIncident_organizationId_state_updatedAt_idx"
ON "ScheduleAnomalyIncident"("organizationId", "state", "updatedAt");

-- CreateIndex
CREATE INDEX "ScheduleAnomalyIncident_organizationId_assigneeId_updatedAt_idx"
ON "ScheduleAnomalyIncident"("organizationId", "assigneeId", "updatedAt");

-- AddForeignKey
ALTER TABLE "ScheduleAnomalyIncident"
ADD CONSTRAINT "ScheduleAnomalyIncident_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
