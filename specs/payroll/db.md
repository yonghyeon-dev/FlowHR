# Payroll DB Notes

## Planned Tables

- `PayrollRun`
- `DeductionProfile`

## Migration

- `202602130001_init_wi0001`
- `202602130002_wi0001_api_extensions`
- `202602140003_payroll_phase2_contract_base`
- `202602140004_payroll_phase2_deduction_profile`
- `202602140006_employee_fk_constraints`

## Referential Integrity (WI-0035)

- `PayrollRun.employeeId` (nullable) → `Employee.id` (FK enforced when present)

## Phase 2 Additive Columns (PayrollRun)

- `withholdingTaxKrw` (int, nullable)
- `socialInsuranceKrw` (int, nullable)
- `otherDeductionsKrw` (int, nullable)
- `totalDeductionsKrw` (int, nullable)
- `netPayKrw` (int, nullable)
- `deductionBreakdown` (json, nullable)
- `deductionProfileId` (string, nullable)
- `deductionProfileVersion` (int, nullable)

## WI-0006 Additive Table (`DeductionProfile`)

- `id` (string, PK)
- `name` (string)
- `version` (int)
- `mode` (`manual` or `profile`)
- `withholdingRate` (decimal, nullable)
- `socialInsuranceRate` (decimal, nullable)
- `fixedOtherDeductionKrw` (int, default 0)
- `active` (boolean)
- `createdAt`, `updatedAt`

## Compatibility

- Expand-contract migration style.
- Attendance data is consumed via API/events or projection only.
- Existing gross-only path remains valid while `payroll_deductions_v1` is off.
- Existing manual deduction input path remains valid while profile mode is introduced.
