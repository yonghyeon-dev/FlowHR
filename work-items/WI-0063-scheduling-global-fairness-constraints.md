# WI-0063: Scheduling Global Fairness Constraint Solver Baseline

## Background and Problem

Tenant-level fairness report/apply (WI-0059, WI-0061) optimizes each employee independently.
Independent recommendations can still concentrate planned minutes on specific dates at organization scope.

Phase 2 needs a deterministic multi-employee global constraint pass that coordinates per-employee offsets
for better daily planned-minute balance before write-back.

## Scope

### In Scope

- Extend fairness report/apply payload with optional `globalConstraints`:
  - `objective`: `MINIMIZE_DAILY_PLANNED_MINUTES_GAP`
  - `maxDailyPlannedMinutesGap` (optional threshold)
- Add deterministic global recommendation selection across employees:
  - choose one offset per employee from evaluated options
  - objective: minimize organization-level daily planned-minute gap over matched dates
- Extend fairness report response with global summary:
  - objective, daily planned-minute gap, threshold, thresholdBreached, daily totals
- Extend fairness apply behavior:
  - if threshold is breached, reject write-back (`409`) before schedule writes
  - if threshold is satisfied, apply recommendations as before
- Preserve existing permission/tenant/overlap/audit/event invariants.

### Out of Scope

- Employee preference weighting and labor-law multi-objective optimization
- Cross-tenant/global scheduler
- Auto-remediation/retry orchestration for strict constraint failures

## User Scenarios

1. Manager requests fairness report with global constraints and receives diversified per-employee offsets.
2. Manager applies fairness with global constraints and schedules are created only when threshold is satisfied.
3. If threshold cannot be satisfied, apply endpoint fails with 409 and no schedules are written.

## Payroll Accuracy and Calculation Rules

- Scheduling fairness constraints affect planned schedules only.
- Attendance/payroll calculation logic remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Fairness report (global constraints) | Allow | Allow | Deny | Allow |
| Fairness apply (global constraints) | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none (runtime solver behavior only)
- Migration IDs:
  - none
- Backward compatibility:
  - additive payload/response fields only

## API and Event Changes

- Updated endpoints:
  - `POST /scheduling/rotations/fairness`
  - `POST /scheduling/rotations/fairness/apply`
- Added request field:
  - `globalConstraints`
- Added response field:
  - `global`
- Events published:
  - none new (existing `scheduling.rotation.assigned.v1` unchanged)

## Test Plan

- Unit:
  - global constraint normalization and threshold validation
  - deterministic recommendation selection across employees
- Integration:
  - constrained fairness report returns diversified offsets and global summary
  - constrained fairness apply succeeds when threshold is satisfied
  - constrained fairness apply fails with 409 when threshold is breached
- Regression:
  - fairness report/apply paths remain backward compatible when `globalConstraints` is omitted
- Authorization:
  - employee role denied on fairness report/apply
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.rotation.fairness.report.generated` (global summary payload extended)
  - `scheduling.rotation.fairness.applied` (global summary payload extended)
- Metrics:
  - `schedule_rotation_fairness_global_solver_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - no dedicated flag (runtime additive behavior)
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
