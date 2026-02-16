# WI-0065: Scheduling Anomaly Cockpit Dashboard Baseline

## Background and Problem

Current anomaly API (`GET /scheduling/anomalies`) is employee-scoped for manager role and optimized for detail inspection.
Operators still need a tenant-level cockpit view to triage severity and prioritize actions without per-employee 반복 조회.

Phase 2 needs a read-only anomaly cockpit baseline for operator triage flow.

## Scope

### In Scope

- Add cockpit endpoint:
  - `GET /scheduling/anomalies/cockpit`
- Cockpit query fields:
  - `from`, `to`, `lateThresholdMinutes` (optional), `topN` (optional)
- Cockpit output:
  - tenant-level counts (evaluated/late/no-show)
  - severity distribution (minor/major/critical)
  - employee-level anomaly summary (severity 포함)
  - prioritized action queue (`topN`) with recommended action text
- Add cockpit audit event:
  - `scheduling.anomaly.cockpit.generated`
- Preserve existing anomaly report endpoint behavior.

### Out of Scope

- Real-time push/streaming UI transport
- SLA timer engine and auto ticket integration
- Cross-tenant cockpit aggregation

## User Scenarios

1. Manager opens cockpit and receives tenant-level severity summary with prioritized queue.
2. Employee role cannot access cockpit endpoint.
3. Operator can reduce queue size with `topN` for triage sessions.

## Payroll Accuracy and Calculation Rules

- Cockpit is read-only monitoring path.
- Payroll calculation logic remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Cockpit anomaly dashboard read | Allow | Allow | Deny | Allow |
| Anomaly detail read (`/anomalies`) | Allow | Allow(직원 지정) | Own-only | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (read-model runtime only)
- Backward compatibility:
  - additive endpoint only

## API and Event Changes

- Endpoint added:
  - `GET /scheduling/anomalies/cockpit`
- Events published:
  - none
- Audit events:
  - `scheduling.anomaly.cockpit.generated`

## Test Plan

- Unit:
  - cockpit query validation (`topN`, threshold)
  - severity/queue prioritization ordering
- Integration:
  - manager cockpit query returns severity summary and employee aggregation
  - employee cockpit query denied (403)
  - cockpit `topN` limit applies to queue
- Regression:
  - existing `/scheduling/anomalies` endpoint behavior unchanged
- Authorization:
  - scheduling write-any boundary required for cockpit
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.anomaly.cockpit.generated`
- Metrics:
  - `schedule_anomaly_cockpit_query_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - no dedicated flag (read-only additive endpoint)
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
