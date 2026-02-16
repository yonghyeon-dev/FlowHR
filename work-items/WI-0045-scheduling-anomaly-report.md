# WI-0045: Scheduling to Attendance Anomaly Report Baseline

## Background and Problem

Scheduling CRUD and template assignment are available, but there is no built-in report that compares planned schedules with actual attendance behavior. Managers currently need manual checks to detect late arrivals or no-show cases.

Phase 2 requires a non-blocking anomaly signal first, before adding automated enforcement.

## Scope

### In Scope

- Add read-only anomaly report API:
  - `GET /api/scheduling/anomalies`
- Detect baseline anomalies per schedule:
  - `LATE` (check-in is after schedule start + threshold)
  - `NO_SHOW` (no overlapping attendance record)
- Enforce existing role and tenant boundaries when reading anomaly report.
- Emit audit trail for anomaly report generation.

### Out of Scope

- Automatic penalty/approval workflow based on anomalies
- Payroll deduction linkage
- Notification fan-out by anomaly severity
- Real-time streaming/WebSocket updates

## User Scenarios

1. Manager requests anomaly report for one employee and receives late/no-show signals.
2. Employee requests own anomaly report and can only access own data.
3. Cross-tenant or out-of-scope employee access is blocked.

## Payroll Accuracy and Calculation Rules

- This WI is report-only and does not mutate payroll or attendance state.
- Gross/net payroll computation behavior remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| List anomalies (any or scoped) | Allow | Allow (employeeId required) | Own only | Allow | Allow |
| Access other tenant employee | Deny (404 for tenant scope) | Deny (404) | Deny | Deny (when tenant-scoped) | N/A |

## Data Changes (Tables and Migrations)

- Tables read:
  - `WorkSchedule`
  - `AttendanceRecord`
- Migration IDs:
  - none (read-only feature)
- Backward compatibility plan:
  - additive API only (non-breaking)

## API and Event Changes

- Endpoints:
  - `GET /api/scheduling/anomalies`
- Events published:
  - none
- Events consumed:
  - none

## Test Plan

- Unit:
  - late threshold validation boundaries
  - overlap matching and anomaly classification logic
- Integration:
  - manager query requires employeeId
  - employee own-only access
  - cross-tenant lookup is blocked
- Regression:
  - schedule and attendance list permissions remain enforced
- Authorization:
  - intersection of scheduling-list and attendance-list permissions
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.anomaly.report.generated`
- Metrics:
  - `schedule_anomaly_report_count` (optional)
  - `schedule_anomaly_late_count` (optional)
  - `schedule_anomaly_no_show_count` (optional)
- Alert conditions:
  - none (non-blocking report)

## Rollback Plan

- Feature flag behavior:
  - hide anomaly API from routing if rollback needed
- DB rollback method:
  - none (no schema changes)
- Recovery target time:
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
