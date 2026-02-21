-- WI-0186: Add payroll payslip delivery and receipt confirmation columns.

ALTER TABLE "PayrollRun"
  ADD COLUMN IF NOT EXISTS "payslipDeliveryChannel" TEXT,
  ADD COLUMN IF NOT EXISTS "payslipDistributedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "payslipDistributedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "payslipReceiptConfirmedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "payslipReceiptConfirmedBy" TEXT;
