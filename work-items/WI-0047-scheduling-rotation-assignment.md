# WI-0047: Scheduling Rotation Assignment Baseline

## Background and Problem

Template single/range assignment is implemented, but managers still need manual sequencing when alternating shifts (for example day/night) across a planning window.

Phase 2 needs a minimal rotation baseline so template sequences can be assigned in one request without introducing a full optimization engine.

## Scope

### In Scope

- Add rotation assignment API:
  - `POST /api/scheduling/rotations/assign`
- Accept `templateIds` sequence (2+ unique ids) and apply cyclic assignment over matched weekdays.
- Require all rotation templates share same weekday set.
- Enforce preflight overlap validation (no partial writes on conflict).
- Emit aggregate audit/event trace for rotation assignment.

### Out of Scope

- Auto balancing by workload/skill/cost
- Multi-employee optimization
- Shift swap and approval workflow

## User Scenarios

1. Manager alternates two templates (day/night) for one employee over a week in one call.
2. Rotation rejects mixed weekday templates to avoid ambiguous date matching.
3. If one generated schedule conflicts, the whole request fails without writes.

## Payroll Accuracy and Calculation Rules

- Rotation assignment only creates `WorkSchedule` rows.
- Payroll and attendance state transitions are unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Rotation assignment | Allow | Allow | Deny | Allow |
| Cross-tenant template access | Deny (404) | Deny (404) | Deny | N/A |
| Cross-tenant employee target | Deny (404) | Deny (404) | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables used:
  - `WorkSchedule`
  - `WorkScheduleTemplate`
- Migration IDs:
  - none (runtime/API only)
- Backward compatibility:
  - additive endpoint/event only (non-breaking)

## API and Event Changes

- Endpoint:
  - `POST /api/scheduling/rotations/assign`
- Events published:
  - `scheduling.rotation.assigned.v1`
- Events consumed:
  - none

## Test Plan

- Unit:
  - templateIds validation (unique, min length)
  - shared weekday-set validation
- Integration:
  - manager/admin success path
  - employee denied (403)
  - cross-tenant hidden (404)
  - overlap preflight conflict (409, no writes)
- Regression:
  - single/range template assignment behavior unchanged
  - overlap guard remains consistent
- Authorization:
  - permission boundary for rotation endpoint
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.rotation.assigned`
- Metrics:
  - `schedule_rotation_assign_count` (optional)
  - `schedule_rotation_assign_created_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - hide rotation endpoint when rollback required
- DB rollback:
  - not required (no schema change)
- Recovery target:
  - < 30m

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
