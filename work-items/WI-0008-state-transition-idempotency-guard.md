# WI-0008: State Transition Idempotency Guard

## Background and Problem

Core approval/confirmation endpoints must reject duplicate state transitions to prevent duplicate audit/event emissions and accidental repeated actions.

## Scope

### In Scope

- Reject duplicate attendance approvals when state is not `PENDING`.
- Reject duplicate payroll confirmations when state is not `PREVIEWED`.
- Add regression assertions for memory/prisma e2e flows.

### Out of Scope

- Generic idempotency-key middleware across all endpoints.
- Distributed lock strategy for multi-region concurrency.

## User Scenarios

1. Manager accidentally retries attendance approval request.
2. Payroll operator retries payroll confirmation request after success.
3. System preserves single source of truth for approval/confirm transitions.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator |
| --- | --- | --- | --- | --- |
| Attendance approve (first) | Allow | Allow | Deny | Deny |
| Attendance approve (duplicate) | 409 | 409 | Deny | Deny |
| Payroll confirm (first) | Allow | Deny | Deny | Allow |
| Payroll confirm (duplicate) | 409 | Deny | Deny | 409 |

## Test Plan

- Memory e2e:
  - duplicate attendance approval returns `409`
  - duplicate payroll confirmation returns `409`
- Prisma e2e:
  - duplicate attendance approval returns `409`
  - duplicate payroll confirmation returns `409`

## Definition of Done (DoD)

- [x] Duplicate state transition guard implemented.
- [x] Memory/prisma e2e regression assertions added.
- [x] Existing audit/event sequence remains deterministic.
- [ ] QA Spec Gate and Code Gate are both passed.
