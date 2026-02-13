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
