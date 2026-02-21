# WI-0175: Ops Cleanup - Production Smoke Teardown Hardening and Incident Auto-Close

## Background and Problem

Before starting the next product feature, repository/process cleanup is required.
Two operational gaps were found:

1. `production-auth-smoke` intermittently failed at teardown due to FK ordering:
   - `Organization` delete failed with `ApprovalStageHistory_organizationId_fkey` (`P2003`)
2. `payroll-phase2-health` opened incident issues on failure but did not auto-close on later success.

These create persistent noise in issue tracking and reduce signal quality for actual incidents.

## Scope

### In Scope

- Harden smoke teardown in `scripts/tests/production-auth-smoke.test.ts`
  - delete `ApprovalExecutionActionLog` -> `ApprovalExecution` -> `ApprovalStageHistory` by smoke org
  - keep existing payroll/employee/org cleanup flow
- Add success auto-close step in `.github/workflows/payroll-phase2-health.yml`
  - close open `[phase2-health]` incidents on successful run
- Add WI-0175 regression test:
  - `scripts/tests/e2e-wi0175-ops-cleanup-production-smoke-teardown-and-incident-auto-close.test.ts`
- Include WI-0175 e2e in MVP/FULL suites (`package.json`)

### Out of Scope

- New product UI/API features
- DB schema changes or migrations
- Alert channel expansion

## User Scenarios

1. Scheduled production smoke no longer fails only because teardown order violates FK constraints.
2. Phase2 health incidents close automatically after a successful health run.
3. Ops issue board remains focused on active failures only.

## Data and API Changes

- None

## Rollback Plan

- Revert teardown additions in `production-auth-smoke.test.ts`.
- Remove success auto-close step from `payroll-phase2-health.yml`.
- Remove WI-0175 e2e and package wiring.

## Definition of Done (DoD)

- [x] Production smoke teardown includes approval execution/stage-history cleanup before organization delete.
- [x] Payroll phase2 health workflow can auto-close open phase2 incident issues on success.
- [x] WI-0175 e2e exists and is wired into MVP/FULL suites.
