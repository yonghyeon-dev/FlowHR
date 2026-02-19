# WI-0110: Payroll Statutory Golden Regression Expansion

## Background and Problem

Payroll statutory baseline logic has e2e coverage (WI-0101/0105/0106), but golden fixture regression currently stops at profile mode (`GC-006`). This leaves a gap where deterministic statutory deductions are not pinned in the golden suite used by CI change-control gates.

## Scope

### In Scope

- Add statutory golden fixtures for:
  - progressive bracket + contribution cap case
  - tax-credit + monthly-boundary case
- Extend golden fixture validator to accept `phase2.mode=statutory_kr_baseline`.
- Extend golden regression tests to validate new mode handling.
- Update payroll contract/spec references for expanded golden coverage.

### Out of Scope

- New payroll runtime formulas
- New API endpoint
- Legal-grade tax engine expansion

## User Scenarios

1. QA updates payroll logic and CI immediately blocks unintended statutory deduction drift.
2. Operator replays golden fixtures and confirms statutory net pay remains deterministic.
3. Reviewer can trace statutory fixture updates to explicit work item and contract bump.

## Payroll Accuracy and Calculation Rules

- `totalDeductionsKrw = withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw`
- `netPayKrw = grossPayKrw - totalDeductionsKrw`
- Statutory golden fixtures must preserve deterministic totals across reruns.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| Run golden regression checks | Allow | Deny | Deny | Allow | Allow |
| Update statutory golden fixtures | Allow | Deny | Deny | Allow | Allow |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: test artifact expansion only

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - golden fixture schema validator accepts statutory mode
  - validator rejects unknown phase2 mode
- Integration:
  - golden fixture validation includes statutory fixture files
- Regression:
  - `golden.test` runs GC-001 ~ GC-008 and verifies statutory totals/net formulas
  - `test_check_golden_fixtures_regression.py` covers statutory mode acceptance
- Authorization:
  - not applicable (CI artifact validation)
- Payroll accuracy:
  - statutory fixture totals and net pay remain deterministic

## Observability and Audit Logging

- Audit events:
  - none (test artifact only)
- Metrics:
  - golden fixture count in CI output
- Alert conditions:
  - golden validation failure on statutory fixture mismatch

## Rollback Plan

- Revert fixture and validator changes if false positives are detected.
- Keep existing payroll e2e coverage active while rollback is applied.
- Recovery target time: 30m.

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [x] GC-007/GC-008 statutory fixtures are added.
- [x] Golden validator and regression tests support statutory mode.
- [x] Payroll contract/API/test-cases/RFC references are updated.
- [x] Golden + governance checks pass in CI-equivalent local run.
- [x] QA Spec Gate and Code Gate are both passed.
