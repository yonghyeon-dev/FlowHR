# Time and Payroll Rules (SSoT)

This document is the shared source of truth for attendance-to-payroll calculations.

## Jurisdiction and Time Zone

- Jurisdiction baseline: Republic of Korea.
- Time zone: `Asia/Seoul`.
- Calendar basis: local business date in `Asia/Seoul`.

## Workday Boundary

- Operational workday boundary is `04:00` local time.
- Time between `00:00` and `03:59:59` is attributed to the previous business day.
- This prevents overnight shifts from splitting incorrectly at midnight.

## Payroll Cycle

- MVP payroll cycle: monthly.
- Payroll period defaults:
  - Start: first day of month `00:00`.
  - End: last day of month `23:59:59`.
- Settlement output for MVP: gross pay only (pre-deduction).

## Rounding Rules

- Duration rounding:
  - Convert raw timestamps to worked minutes.
  - Round to nearest minute, with 30 seconds rounding up.
- Pay amount rounding:
  - Calculate each pay component in KRW.
  - Round final gross amount to whole KRW.

## WI-0001 Premium Rules

- Night category (MVP): `00:00` to `03:59:59` local time.
- Night minutes above 180 minutes are treated as night+overtime premium.
- Holiday minutes:
  - first 480 minutes => holiday multiplier
  - beyond 480 minutes => holiday * overtime combined multiplier

## WI-0003 Leave Accrual Rules

- Yearly accrual settlement actor: `admin` or `payroll_operator`.
- Default annual grant: `15` days.
- Default carry-over cap: `5` days.
- Carry-over formula: `min(max(remainingDays, 0), carryOverCapDays)`.
- Duplicate settlement for same employee/year is rejected.

## WI-0005 Payroll Deduction Rules (Contract)

- Phase 2 is additive to WI-0001 gross-pay flow.
- Total deductions: `withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw`.
- Net pay: `grossPayKrw - totalDeductionsKrw`.
- Final amounts remain whole KRW integers.

## WI-0006 Deduction Profile Rules (Contract)

- Deduction calculation mode:
  - `manual`: use caller-provided deduction values.
  - `profile`: derive deduction values from versioned deduction profile.
- Profile mode must persist `deductionProfileId` and `deductionProfileVersion` on payroll run trace.
- All deduction components must be non-negative KRW integers after rounding.
- Net pay must not be negative; if deductions exceed gross pay, request is rejected.

## Calculation Priority

1. Validate attendance record state (approved vs pending/canceled).
2. Derive payable minutes by category (regular/overtime/night/holiday).
3. Apply multipliers by category.
4. Aggregate to gross pay.
5. Persist payroll trace and audit events.

## Invariants

- Payroll calculation must be deterministic for same inputs.
- Recalculation after correction must keep immutable audit trace.
- Unauthorized users cannot change approved attendance/payroll records.

## Future Scope (Phase 2+)

- Deductions and tax handling.
- Multi-country legal profile support.
- Flexible payroll cycle per organization.
