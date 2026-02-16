# WI-0058: Scheduling Rotation Optimization Baseline

## Background and Problem

Rotation assignment (WI-0047) and balance report (WI-0057) are available, but operators still choose template start order manually.

Phase 2 requires a deterministic optimization baseline that recommends the best template offset against existing schedule load and can optionally apply write-back safely.

## Scope

### In Scope

- Add optimization endpoint:
  - `POST /scheduling/rotations/optimize`
- Input:
  - `employeeId`, `fromDate`, `toDate`, `templateIds`, `apply`
- Behavior:
  - evaluate all template start offsets
  - score each offset by weekday count gap + planned-minute gap
  - return deterministic best offset and optimized template order
  - when `apply=true`, reuse rotation assignment write path and overlap guards
- Append audit log:
  - `scheduling.rotation.optimization.generated`

### Out of Scope

- Cross-employee global fair scheduler
- ML-based optimization objective
- Auto-retry planner for overlap conflicts

## User Scenarios

1. Manager runs optimization dry-run and receives recommended start offset without schedule mutation.
2. Manager runs optimization with `apply=true` and schedules are created using optimized template order.
3. Optimization enforces existing tenant/permission/template invariants.

## Payroll Accuracy and Calculation Rules

- Rotation optimization affects schedule planning only.
- It does not mutate attendance/payroll calculation logic.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Rotation optimization (dry-run/apply) | Allow | Allow | Deny | Allow |
| Rotation assignment write | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (runtime/API behavior only)
- Backward compatibility:
  - additive endpoint only

## API and Event Changes

- Endpoint added:
  - `POST /scheduling/rotations/optimize`
- Events published:
  - none (existing rotation assigned event reused on apply path)
- Events consumed:
  - none
- Audit event:
  - `scheduling.rotation.optimization.generated`

## Test Plan

- Unit:
  - offset evaluation scoring and deterministic tie-break
- Integration:
  - dry-run returns optimized order with no writes
  - apply=true creates schedules with optimized order
  - tenant/permission/weekday-set invariants hold
- Regression:
  - WI-0047 assignment and WI-0057 balance report behavior unchanged
- Authorization:
  - scheduling write-any permission required
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.rotation.optimization.generated`
- Metrics:
  - `schedule_rotation_optimization_count` (optional)
  - `schedule_rotation_optimization_apply_count` (optional)
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
