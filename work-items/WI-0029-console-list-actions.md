# WI-0029: MVP Console List Actions (Attendance/Leave/Payroll)

## Background and Problem

We added list APIs for Attendance, Leave, and Payroll, but the MVP console still requires manual curl/testing to verify list behavior.
To speed up end-to-end verification, the console should expose one-click list actions for these endpoints.

## Scope

### In Scope

- Add a "리스트 조회" panel to the MVP console (`/`) that calls:
  - `GET /api/attendance/records`
  - `GET /api/leave/requests`
  - `GET /api/payroll/runs`
- Allow optional `state` filters for each list.
- Use the existing log panel to display returned payloads.

### Out of Scope

- Pagination and export/download.
- Dedicated UI tables for rendering rows (log JSON is enough for MVP verification).
- Production auth UX improvements (token management).

## User Scenarios

1. Operator sets period range and clicks list buttons to confirm created records/runs exist.
2. Operator filters list by state to quickly see pending/approved/confirmed items.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: list buttons call the runtime list APIs.
- Rounding rule: not applicable.
- Exception handling rule: invalid query should surface as `400` and appear in log panel.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| Use console list actions | Allow | Allow | Allow | Allow | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: UI-only changes

## API and Event Changes

- Endpoints: none (uses existing list endpoints)
- Events published: none
- Events consumed: none

## Test Plan

- Unit: `npm run typecheck`
- Integration: `npm run test:integration`
- Regression: `npm run test:e2e` remains green
- Authorization: not applicable (UI only; API guards already tested)
- Payroll accuracy: not applicable

## Observability and Audit Logging

- Audit events: none
- Metrics: none
- Alert conditions: none

## Rollback Plan

- Feature flag behavior: not applicable
- DB rollback method: not applicable
- Recovery target time: immediate by reverting the UI change

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

