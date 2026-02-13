# WI-0017: Attendance Reject Validation Guard Regression

## Background and Problem

Attendance reject route supports optional reason payload, but invalid input paths were not explicitly fixed by regression tests.
Without guard coverage, malformed JSON or oversized reason payloads can silently regress and weaken audit quality.

## Scope

### In Scope

- Add WI-0001 memory/prisma e2e assertions for reject payload validation guards.
- Cover `invalid JSON body` (`400`) behavior for reject route.
- Cover oversized `reason` payload (`>500`) behavior for reject route.
- Update attendance contract/test-cases to reflect validation guard expectations.

### Out of Scope

- Reject reason taxonomy standardization.
- New DB columns for rejection reason.
- UI-level validation UX changes.

## User Scenarios

1. Manager sends malformed reject payload and API blocks request with `400`.
2. Manager sends reject reason over max length and API blocks request with `400`.
3. Valid reject request still succeeds and preserves audit/event reason trace.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: only approved attendance contributes to payroll preview.
- Rounding rule: not applicable.
- Exception handling rule: invalid reject payload must not produce final-state audit/event side effects.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Reject attendance with valid payload | Allow | Allow | Deny | Deny |
| Reject attendance with invalid payload | Blocked (`400`) | Blocked (`400`) | Deny | Deny |
| Read reject validation failures from logs | Allow | Allow | Deny | Allow (ops only) |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: route validation behavior only, no schema migration

## API and Event Changes

- Endpoints:
  - `POST /api/attendance/records/{recordId}/reject` (validation guard coverage)
- Events published:
  - none added
  - existing `attendance.rejected.v1` remains unchanged for valid payload
- Events consumed:
  - none

## Test Plan

- Unit:
  - reject schema boundary (`reason` max length)
- Integration:
  - invalid reject JSON body returns `400`
  - oversized reject reason returns `400`
  - valid reject request still returns `REJECTED`
- Regression:
  - WI-0001 memory/prisma e2e remains green with added guard assertions
- Authorization:
  - manager/admin-only reject path remains enforced
- Payroll accuracy:
  - invalid reject payload does not alter source record aggregation behavior

## Observability and Audit Logging

- Audit events:
  - invalid reject requests do not emit `attendance.rejected`
- Metrics:
  - `attendance_reject_validation_error_count` (logical guard metric)
- Alert conditions:
  - surge in reject validation `400` errors

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable (no migration).
- Recovery target time: 15m by reverting e2e/contract guard updates.

## Definition of Ready (DoR)

- [ ] Guard scenarios are defined and reproducible.
- [ ] Contract/test-case updates are scoped.
- [ ] QA check items for invalid payload paths are identified.
- [ ] No migration impact is confirmed.

## Definition of Done (DoD)

- [ ] Memory/prisma e2e include invalid reject payload guard coverage.
- [ ] Attendance contract/test-cases reflect guard expectations.
- [ ] All required quality gates pass.
- [ ] Execution plan is updated with WI-0017 completion.
