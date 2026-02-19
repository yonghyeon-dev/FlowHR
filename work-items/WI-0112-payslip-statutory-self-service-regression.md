# WI-0112: Payslip Statutory Self-Service Regression

## Background and Problem

Payroll statutory logic has strong preview-side coverage (WI-0101/0105/0106/0110), but employee self-service payslip retrieval did not have a dedicated regression test that pins both authorization gates and statutory deduction payload visibility together.

## Scope

### In Scope

- Add e2e regression for employee payslip self-service with statutory payroll runs.
- Verify own-confirmed-only authorization gate.
- Verify `withholding/social/total/net` and `deductionBreakdown.additional` remain visible on employee list response.
- Update payroll test-cases with self-service statutory regression case.

### Out of Scope

- Payroll formula or tax rule changes.
- UI layout changes for `/employee/payslips`.
- Mobile payslip channel support.

## User Scenarios

1. Employee can view own confirmed statutory payslip with deduction breakdown.
2. Employee cannot view own PREVIEWED run.
3. Employee cannot view another employee payslip data.

## Payroll Accuracy and Calculation Rules

- Employee list response must preserve persisted statutory totals and net values.
- Self-service authorization must not alter numeric payroll values, only visibility scope.

## Authorization and Role Matrix

| Action | Admin | Payroll Operator | Employee(Self) | Employee(Other) |
| --- | --- | --- | --- | --- |
| List payroll runs (any) | Allow | Allow | Deny | Deny |
| List own confirmed payslips | Allow | Allow | Allow | Deny |
| Access PREVIEWED as employee | Allow | Allow | Deny | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: test/regression expansion only

## API and Event Changes

- Endpoints exercised:
  - `POST /payroll/runs/preview-with-deductions`
  - `POST /payroll/runs/{runId}/confirm`
  - `GET /payroll/runs`
- Events published: none (existing runtime behavior reuse)
- Events consumed: none

## Test Plan

- Unit: not applicable (runtime behavior already covered in prior WIs).
- Integration:
  - employee self-service list returns only own confirmed run
  - employee state=PREVIEWED query rejected with 403
  - employee other-employee query rejected with 403
- Regression:
  - statutory deduction breakdown survives end-to-end into employee list response
- Authorization:
  - own/confirmed guard remains enforced
- Payroll accuracy:
  - statutory totals/net in list response remain non-null and deterministic

## Observability and Audit Logging

- Existing payroll audit events are reused (`payroll.previewed`, `payroll.confirmed`).
- Regression monitors:
  - e2e test failure rate for WI-0112 flow in CI

## Rollback Plan

- Remove WI-0112 test from e2e chain if false-positive instability appears.
- Keep core payroll and authorization tests active while stabilizing.
- Recovery target time: 30m.

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract/test-case linkage reviewed.
- [x] Authorization expectations reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [x] `e2e-wi0112-payslip-statutory-self-service.test.ts` added.
- [x] `test:e2e:mvp` chain includes WI-0112.
- [x] `specs/payroll/test-cases.md` updated with WI-0112 regression case.
- [x] Lint/typecheck + target tests pass locally.
