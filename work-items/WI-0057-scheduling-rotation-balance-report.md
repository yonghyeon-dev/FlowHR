# WI-0057: Scheduling Rotation Balance Report Baseline

## Background and Problem

Rotation assignment baseline exists (WI-0047), but operators lack a read-only diagnostic view to quantify weekday workload imbalance before tuning template order or shift rules.

Phase 2 needs a contract-first rotation balance report that provides objective imbalance metrics and recommendations without mutating schedule data.

## Scope

### In Scope

- Add read-only rotation balance report endpoint:
  - `GET /scheduling/rotations/balance`
- Report includes:
  - weekday schedule counts
  - weekday planned-minute totals
  - imbalance gaps (`weekdayGap`, `plannedMinutesGap`)
  - grade (`BALANCED` / `MODERATE` / `IMBALANCED`)
  - recommendation list
- Reuse existing role boundary rules from schedule list:
  - manager/admin: any (manager requires employeeId)
  - employee: own only
- Append audit log:
  - `scheduling.rotation.balance.report.generated`
- No DB migration and no schedule write-back.

### Out of Scope

- Automatic optimizer write-back to schedule data
- Template sequence auto-tuning and simulation engine
- Multi-employee fairness optimizer

## User Scenarios

1. Manager queries employee rotation balance report and receives imbalance metrics with actionable recommendations.
2. Manager query without `employeeId` is rejected (same boundary as schedule list).
3. Employee can query only own rotation balance report.
4. Query path remains read-only and does not mutate schedules.

## Payroll Accuracy and Calculation Rules

- Rotation balance report is informational only.
- It does not modify attendance/payroll calculation flow.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| View rotation balance report | Allow | Allow (employeeId required) | Own-only | Allow |
| Rotation assignment write | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (read-only runtime/API behavior)
- Backward compatibility:
  - additive endpoint only

## API and Event Changes

- Endpoint added:
  - `GET /scheduling/rotations/balance`
- Events published:
  - none
- Events consumed:
  - none
- Audit event:
  - `scheduling.rotation.balance.report.generated`

## Test Plan

- Unit:
  - weekday/planned-minute imbalance calculation boundaries
  - grade classification boundaries
- Integration:
  - manager employee-scoped report success
  - manager query without employeeId rejected
  - employee cross-employee query rejected
  - read-only behavior (no schedule mutation)
- Regression:
  - WI-0047 rotation assignment behavior unchanged
- Authorization:
  - scheduling list permission boundaries remain intact
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.rotation.balance.report.generated`
- Metrics:
  - `schedule_rotation_balance_report_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - none required (additive read-only endpoint)
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
