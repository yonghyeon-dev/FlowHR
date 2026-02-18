# WI-0101: Payroll KR Statutory Baseline Mode

## Background and Problem

Current payroll phase2 supports only `manual` and `profile` deduction modes. This is insufficient for Korean payroll launch readiness because legal deduction simulation (withholding + social insurance baseline) is still missing.

## Scope

### In Scope

- Add new payroll deduction mode: `statutory_kr_baseline`.
- Add baseline KR deduction calculation (income tax + local income tax + 4 social insurance components).
- Add dedicated feature flag gate for new mode.
- Update payroll contract/API/test-cases and compatibility docs.
- Add e2e regression coverage for new mode.

### Out of Scope

- Full legal-grade tax table implementation.
- Year-end tax settlement.
- Employer contribution accounting.
- Automatic filing/remittance integrations.

## User Scenarios

1. Payroll operator previews payroll with KR statutory baseline deductions and receives deterministic net pay output.
2. System records audit/event traces containing baseline formula inputs and outputs.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: all deduction components are derived from `taxableBaseKrw = max(grossPayKrw - nonTaxableIncomeKrw, 0)`.
- Rounding rule: each component is rounded to whole KRW integer (`Math.round`), then aggregated.
- Exception handling rule: request fails when resulting `netPayKrw < 0`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Preview payroll with deductions | Allow | Deny | Deny | N/A |
| Confirm payroll run | Allow | Deny | Deny | N/A |
| Read/write deduction profile | Allow | Deny | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables: no schema change (reuse existing phase2 deduction fields).
- Migration IDs: none.
- Backward compatibility plan: additive mode only; existing manual/profile behavior unchanged.

## API and Event Changes

- Endpoints:
  - `POST /payroll/runs/preview-with-deductions` accepts `deductionMode=statutory_kr_baseline`.
- Events published:
  - `payroll.deductions.calculated.v1` (existing event, additive payload shape).
- Events consumed:
  - None.

## Test Plan

- Unit:
  - KR baseline component calculation and rounding.
- Integration:
  - API payload validation for `statutory_kr_baseline`.
- Regression:
  - Existing WI-0005/WI-0006 phase2 flows remain green.
- Authorization:
  - Existing payroll operator/admin permission checks remain enforced.
- Payroll accuracy:
  - Deterministic total/net output from identical input.

## Observability and Audit Logging

- Audit events:
  - `payroll.deductions_calculated` with baseline breakdown.
- Metrics:
  - `payroll_deductions_preview_latency_ms` (existing).
- Alert conditions:
  - Repeated `409` from negative net pay path.

## Rollback Plan

- Feature flag behavior: disable `FLOWHR_PAYROLL_KR_BASELINE_V1` to block new mode.
- DB rollback method: not required (no schema change).
- Recovery target time: 15m.

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [ ] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.
