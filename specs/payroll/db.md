# Payroll DB Notes

## Planned Tables

- `PayrollRun`

## Migration

- `202602130001_init_wi0001`
- `202602130002_wi0001_api_extensions`
- `202602140003_payroll_phase2_contract_base`

## Phase 2 Additive Columns (PayrollRun)

- `withholdingTaxKrw` (int, nullable)
- `socialInsuranceKrw` (int, nullable)
- `otherDeductionsKrw` (int, nullable)
- `totalDeductionsKrw` (int, nullable)
- `netPayKrw` (int, nullable)
- `deductionBreakdown` (json, nullable)

## Compatibility

- Expand-contract migration style.
- Attendance data is consumed via API/events or projection only.
- Existing gross-only path remains valid while `payroll_deductions_v1` is off.
