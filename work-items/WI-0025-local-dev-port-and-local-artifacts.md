# WI-0025: Local Dev Port (3001) and Local Artifact Ignore

## Background and Problem

During local verification, the operator attempted to access the dev server on port `3001` and could not reach it because the default Next.js dev port is `3000`.
Also, local temporary directories/log artifacts can show up as untracked noise and even cause `git status` warnings (permission denied on temp dirs), slowing down iteration.

## Scope

### In Scope

- Add an explicit npm script to start Next.js dev server on port `3001`.
- Document how to run the dev server on `3001`.
- Ignore common local artifact files/directories created by CI scripts and local runs.

### Out of Scope

- Any production/staging port configuration changes.
- Runtime feature changes to Attendance/Leave/Payroll APIs.

## User Scenarios

1. Operator runs `npm run dev:3001` and can open `http://localhost:3001`.
2. `git status` stays clean and does not warn about local temp folders created by CI tooling.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: not applicable.
- Rounding rule: not applicable.
- Exception handling rule: not applicable.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Run local dev server on 3001 | Allow | Allow | Allow | Allow |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: not applicable

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit: `npm run typecheck`
- Integration: `npm run test:integration`
- Regression: CI gates stay green
- Authorization: not applicable
- Payroll accuracy: not applicable

## Observability and Audit Logging

- Audit events: none
- Metrics: none
- Alert conditions: none

## Rollback Plan

- Feature flag behavior: not applicable
- DB rollback method: not applicable
- Recovery target time: immediate (revert scripts/docs)

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [ ] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [x] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [x] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [x] ADR linked when architecture/compatibility changed.

