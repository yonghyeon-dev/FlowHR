-- WI-0090: Leave policy settings (annual grant + carry-over cap) per organization.

CREATE TABLE "LeavePolicy" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "annualGrantDays" INTEGER NOT NULL DEFAULT 15,
  "carryOverCapDays" INTEGER NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeavePolicy_organizationId_key" ON "LeavePolicy"("organizationId");

ALTER TABLE "LeavePolicy"
ADD CONSTRAINT "LeavePolicy_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

