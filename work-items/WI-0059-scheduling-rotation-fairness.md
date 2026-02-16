# WI-0059: Scheduling Rotation Fairness Report Baseline

## Background and Problem

Rotation optimization (WI-0058) works per employee, but operators still lack a tenant-level view to compare imbalance risk across multiple employees in one pass.

Phase 2 needs a deterministic fairness report baseline that aggregates per-employee optimization outcomes without writing schedules.

## Scope

### In Scope

- Add tenant-level fairness endpoint:
  - `POST /scheduling/rotations/fairness`
- Input:
  - `organizationId` (system only), `fromDate`, `toDate`, `templateIds`, optional `employeeIds`
- Behavior:
  - evaluate per-employee best rotation offset using WI-0058 scoring baseline
  - aggregate fairness summary (`max/avg` weekday gap, planned-minute gap, grade)
  - return deterministic per-employee recommendations sorted by imbalance severity
- Append audit log:
  - `scheduling.rotation.fairness.report.generated`
- Keep endpoint strictly read-only.

### Out of Scope

- Multi-employee batch write-back orchestration
- Cross-tenant/global optimizer
- ML or forecast-based fairness objective

## User Scenarios

1. Manager requests fairness report for selected employees and receives ranked imbalance recommendations.
2. Manager requests fairness report for all active employees in tenant scope.
3. Employee role cannot access fairness endpoint.
4. Report path stays read-only and does not mutate schedules.

## Payroll Accuracy and Calculation Rules

- Fairness report is planning telemetry only.
- It does not modify attendance/payroll calculations.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Generate rotation fairness report | Allow | Allow | Deny | Allow (organizationId required when no tenant scope) |
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
  - `POST /scheduling/rotations/fairness`
- Events published:
  - none
- Events consumed:
  - none
- Audit event:
  - `scheduling.rotation.fairness.report.generated`

## Test Plan

- Unit:
  - deterministic ranking/sort and summary aggregation boundaries
- Integration:
  - manager fairness report success for selected employees
  - unknown employee in organization scope rejected
  - employee role denied
  - deterministic response for identical inputs
- Regression:
  - WI-0058 optimization behavior unchanged
  - fairness path does not mutate schedules
- Authorization:
  - scheduling write-any boundary required
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.rotation.fairness.report.generated`
- Metrics:
  - `schedule_rotation_fairness_report_count` (optional)
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
