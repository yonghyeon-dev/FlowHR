# WI-0061: Scheduling Fairness Write-Back Orchestration Baseline

## Background and Problem

Tenant-level fairness report (WI-0059) provides recommendations, but operators still have to apply each employee rotation manually.

Phase 2 needs a controlled write-back orchestration baseline that applies fairness recommendations in one request with overlap preflight safety.

## Scope

### In Scope

- Add fairness apply endpoint:
  - `POST /scheduling/rotations/fairness/apply`
- Input:
  - same payload as fairness report (`organizationId`, `fromDate`, `toDate`, `templateIds`, optional `employeeIds`)
- Behavior:
  - generate fairness recommendations (WI-0059 logic)
  - preflight overlap checks for all target employees before writes
  - create schedules per employee using optimized template order
  - emit rotation assignment audit/event per employee and fairness apply audit summary
- Append audit logs:
  - `scheduling.rotation.fairness.report.generated`
  - `scheduling.rotation.assigned`
  - `scheduling.rotation.fairness.applied`

### Out of Scope

- Cross-tenant/global scheduler
- Constraint solver with preferences/labor-law optimization
- Automatic retry queue for concurrent write conflicts

## User Scenarios

1. Manager applies fairness recommendations for selected employees and schedules are created in one operation.
2. Employee role cannot call fairness apply endpoint.
3. Overlap conflicts are preflighted before write-back starts.

## Payroll Accuracy and Calculation Rules

- Scheduling write-back changes planned schedules only.
- Attendance/payroll calculation rules remain unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Fairness report generate | Allow | Allow | Deny | Allow |
| Fairness write-back apply | Allow | Allow | Deny | Allow |
| Rotation assignment write | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - `WorkSchedule` (runtime inserts only)
- Migration IDs:
  - none (runtime/API behavior only)
- Backward compatibility:
  - additive endpoint only

## API and Event Changes

- Endpoint added:
  - `POST /scheduling/rotations/fairness/apply`
- Events published:
  - `scheduling.rotation.assigned.v1` (per employee write)
- Events consumed:
  - none
- Audit events:
  - `scheduling.rotation.fairness.applied`

## Test Plan

- Unit:
  - fairness apply payload validation
  - assignment orchestration summary aggregation
- Integration:
  - manager fairness apply succeeds and creates schedules for all selected employees
  - employee role denied
  - assignment event/audit emitted per employee
- Regression:
  - WI-0059 fairness report remains read-only and deterministic
  - WI-0047 rotation assignment behavior unchanged
- Authorization:
  - scheduling write-any boundary required
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.rotation.fairness.applied`
- Metrics:
  - `schedule_rotation_fairness_apply_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - none required (additive endpoint)
- DB rollback:
  - none
- Recovery target:
  - < 15m

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
