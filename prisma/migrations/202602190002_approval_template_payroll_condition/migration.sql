-- WI-0113: approval template payroll conditional routing baseline
ALTER TABLE "ApprovalLineTemplate"
ADD COLUMN "payrollGrossPayMinKrw" INTEGER,
ADD COLUMN "payrollGrossPayMaxKrw" INTEGER;

CREATE INDEX "ApprovalLineTemplate_organizationId_domain_active_payrollGrossPayMinKrw_payrollGrossPayMaxKrw_idx"
ON "ApprovalLineTemplate"(
  "organizationId",
  "domain",
  "active",
  "payrollGrossPayMinKrw",
  "payrollGrossPayMaxKrw"
);
