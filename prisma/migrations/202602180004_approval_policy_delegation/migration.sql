-- CreateEnum
CREATE TYPE "ApprovalDomain" AS ENUM ('ATTENDANCE', 'LEAVE', 'PAYROLL');

-- CreateTable
CREATE TABLE "ApprovalPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "attendanceApproverRole" TEXT NOT NULL DEFAULT 'manager',
    "leaveApproverRole" TEXT NOT NULL DEFAULT 'manager',
    "payrollApproverRole" TEXT NOT NULL DEFAULT 'payroll_operator',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDelegation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "domain" "ApprovalDomain" NOT NULL,
    "delegatorRole" TEXT NOT NULL,
    "delegateActorId" TEXT NOT NULL,
    "reason" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalPolicy_organizationId_key" ON "ApprovalPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "ApprovalDelegation_organizationId_domain_active_startsAt_endsAt_idx" ON "ApprovalDelegation"("organizationId", "domain", "active", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ApprovalDelegation_organizationId_delegateActorId_active_idx" ON "ApprovalDelegation"("organizationId", "delegateActorId", "active");

-- AddForeignKey
ALTER TABLE "ApprovalPolicy" ADD CONSTRAINT "ApprovalPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDelegation" ADD CONSTRAINT "ApprovalDelegation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed role permissions for approval policy/delegation management
INSERT INTO "RolePermission" ("roleId", "permission")
VALUES
    ('admin', 'approval.policy.read'),
    ('admin', 'approval.policy.write'),
    ('admin', 'approval.delegation.read'),
    ('admin', 'approval.delegation.write'),
    ('system', 'approval.policy.read'),
    ('system', 'approval.policy.write'),
    ('system', 'approval.delegation.read'),
    ('system', 'approval.delegation.write'),
    ('manager', 'approval.policy.read'),
    ('manager', 'approval.delegation.read'),
    ('manager', 'approval.delegation.write'),
    ('payroll_operator', 'approval.policy.read'),
    ('payroll_operator', 'approval.delegation.read')
ON CONFLICT ("roleId", "permission") DO NOTHING;
