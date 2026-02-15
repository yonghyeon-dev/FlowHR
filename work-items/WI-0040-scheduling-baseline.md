# WI-0040: Scheduling Baseline (Work Schedule API)

## Background and Problem

FlowHR currently supports recording actual attendance (clock-in/out) but does not support planned schedules.
For production HR operations, managers need a simple way to assign planned working windows per employee so
attendance can be validated, anomalies can be detected, and future scheduling features can build on a stable base.

## Scope

### In Scope

- Define a minimal scheduling domain model (`WorkSchedule`).
- Create schedule entries for employees (planned start/end, breaks, holiday flag, notes).
- List schedule entries by period (`from`/`to`) with role boundary guards.
- Emit audit logs and a domain event on schedule assignment.
- Enforce tenant isolation for schedule data (app tenant scoping + Supabase RLS policy).

### Out of Scope

- Shift templates, rotations, or recurring schedule rules.
- GPS/QR/geofence clock-in enforcement.
- Automatic payroll impact or schedule-to-attendance reconciliation.
- UI beyond the MVP Operations Console surface.

## User Scenarios

1. Manager assigns a schedule entry to an employee for a given time window.
2. Employee lists and views only their own schedules.
3. Cross-employee reads are blocked for employees; manager queries require `employeeId`.

## Payroll Accuracy and Calculation Rules

- Scheduling is informational only for MVP. Payroll continues to use approved attendance records as the source of truth.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Create schedule | Allow | Allow | Deny | Allow |
| List schedules (any) | Allow | Deny | Deny | Allow |
| List schedules (by employeeId) | Allow | Allow (requires employeeId) | Deny | Allow |
| List schedules (own) | Allow | Allow | Allow (own only) | Allow |

## Data Changes (Tables and Migrations)

- Tables: `WorkSchedule`
- Migration IDs: `202602150003_scheduling_baseline`
- Backward compatibility plan:
  - Additive new table with RLS policies.
  - No changes to existing attendance/payroll flows.

## API and Event Changes

- Endpoints:
  - `GET /api/scheduling/schedules`
  - `POST /api/scheduling/schedules`
- Events published:
  - `scheduling.schedule.assigned.v1`
- Events consumed:
  - none

## Test Plan

- Unit:
  - schedule payload validation boundary checks
- Integration:
  - manager can create schedule, employee cannot
  - list schedule role boundary checks (employee own-only; manager requires employeeId)
- Regression:
  - none
- Authorization:
  - permission boundaries for create/list
- Payroll accuracy:
  - not applicable

## Observability and Audit Logging

- Audit events:
  - `scheduling.schedule.assigned`
- Metrics:
  - schedule assignment count (optional)
- Alert conditions:
  - none initially

## Rollback Plan

- Feature flag behavior: keep `FLOWHR_SCHEDULING_V1` off by default (doc-only) for rollout sequencing.
- DB rollback method: drop/disable RLS policies for `WorkSchedule` via break-glass (non-prod only).
- Recovery target time: 60m

## Definition of Ready (DoR)

- [ ] Requirements are unambiguous and testable.
- [ ] Domain contract drafted or updated.
- [ ] Role matrix reviewed by QA.
- [ ] Data migration impact assessed.
- [ ] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [ ] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.

