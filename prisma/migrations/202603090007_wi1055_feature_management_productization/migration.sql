ALTER TABLE "Organization"
  ADD COLUMN "payrollFeatureDeductionsEnabled" BOOLEAN,
  ADD COLUMN "payrollFeatureDeductionProfileEnabled" BOOLEAN,
  ADD COLUMN "payrollFeatureKrBaselineEnabled" BOOLEAN,
  ADD COLUMN "payrollFeatureKrInsuranceSettlementEnabled" BOOLEAN,
  ADD COLUMN "payrollFeatureClosePeriodEnabled" BOOLEAN,
  ADD COLUMN "payrollFeaturePayslipDeliveryEnabled" BOOLEAN,
  ADD COLUMN "payrollFeatureYearEndEnabled" BOOLEAN,
  ADD COLUMN "payrollFeatureYearEndDeductionInputEnabled" BOOLEAN,
  ADD COLUMN "payrollFeatureYearEndFilingExportEnabled" BOOLEAN,
  ADD COLUMN "payrollFeatureYearEndFilingSubmissionEnabled" BOOLEAN;
