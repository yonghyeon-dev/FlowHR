# WI-0046: Scheduling Template Multi-Day Range Assignment Baseline

## Background and Problem

Template assignment currently supports only one date at a time. Managers still need repetitive API calls when planning weekly schedules for a month.

Phase 2 requires a minimal recurring assignment baseline so multi-day planning can be executed in a single request.

## Scope

### In Scope

- Add template range assignment API:
  - `POST /api/scheduling/templates/{templateId}/assign-range`
- Generate schedules for dates that match template weekdays within `[fromDate, toDate]`.
- Add preflight overlap checks so the request fails before any write when conflicts exist.
- Emit aggregate audit/event trace for range assignment.

### Out of Scope

- Rotation engine (2/3-shift patterns)
- Cross-template optimization and balancing
- Auto approval/notification chaining

## User Scenarios

1. Manager assigns a weekday template to one employee for two weeks in one API call.
2. API creates only dates matching template weekdays.
3. If any generated schedule overlaps existing/planned windows, API returns 409 and writes nothing.

## Payroll Accuracy and Calculation Rules

- This WI creates `WorkSchedule` entries only.
- Payroll calculation logic remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Assign template by range | Allow | Allow | Deny | Allow |
| Cross-tenant template access | Deny (404) | Deny (404) | Deny | N/A |
| Cross-tenant employee target | Deny (404) | Deny (404) | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables used:
  - `WorkSchedule`
  - `WorkScheduleTemplate`
- Migration IDs:
  - none (runtime/API only)
- Backward compatibility:
  - additive endpoint and event only (non-breaking)

## API and Event Changes

- Endpoint:
  - `POST /api/scheduling/templates/{templateId}/assign-range`
- Events published:
  - `scheduling.template.range_assigned.v1`
- Events consumed:
  - none

## Test Plan

- Unit:
  - date range validation (`fromDate <= toDate`, max window)
  - weekday filtering and generation count
- Integration:
  - manager/admin success
  - employee denied (403)
  - cross-tenant hidden as 404
  - overlap preflight causes 409 with no writes
- Regression:
  - existing single-date assign endpoint behavior unchanged
  - overlap guard remains consistent
- Authorization:
  - permission boundary for range assignment endpoint
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.template.range_assigned`
- Metrics:
  - `schedule_template_range_assign_count` (optional)
  - `schedule_template_range_assign_created_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - keep endpoint hidden behind `scheduling_v1` rollout switch
- DB rollback:
  - no migration rollback required
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
