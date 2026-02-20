-- CreateTable
CREATE TABLE "ApprovalLineTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" "ApprovalDomain" NOT NULL,
    "approverRoles" TEXT[] NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalLineTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalLineTemplate_organizationId_domain_name_key" ON "ApprovalLineTemplate"("organizationId", "domain", "name");

-- CreateIndex
CREATE INDEX "ApprovalLineTemplate_organizationId_domain_active_idx" ON "ApprovalLineTemplate"("organizationId", "domain", "active");

-- AddForeignKey
ALTER TABLE "ApprovalLineTemplate" ADD CONSTRAINT "ApprovalLineTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
