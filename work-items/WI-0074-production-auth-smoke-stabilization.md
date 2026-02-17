# WI-0074: Production Auth Smoke Stabilization and Incident Auto-Close

## Background and Problem

Open incident issue `#108` shows `production-auth-smoke` can fail when payroll preview input references an employee that does not exist in production.

Current workflow also creates a new incident issue on each failure without resolving old open smoke incidents when health is restored.

## Scope

### In Scope

- Stabilize `scripts/tests/production-auth-smoke.test.ts`:
  - create temporary `Organization` and `Employee` test fixtures before payroll preview
  - include `organization_id` in smoke user metadata
  - cleanup created org/employee/audit artifacts after run
- Improve `.github/workflows/production-auth-smoke.yml`:
  - failure path: upsert behavior (comment on existing open smoke incident instead of unconditional new issue)
  - success path: close open smoke incident issues with success run reference comment

### Out of Scope

- Payroll business logic changes
- Supabase auth role model redesign
- Production schema changes/migrations

## User Scenarios

1. Scheduled smoke run executes with isolated fixtures and no longer fails with `employee not found`.
2. If smoke fails again, existing open smoke incident is reused with comment updates.
3. When smoke passes, open smoke incidents are closed automatically with traceable run link.

## Data Changes (Tables and Migrations)

- Tables impacted at runtime only (test fixture lifecycle):
  - `Organization`, `Employee`, `PayrollRun`, `AuditLog`
- Migrations:
  - none
- Backward compatibility:
  - no API contract change

## Test Plan

- Local validation:
  - `npm run typecheck`
  - `npm run lint`
- Runtime validation:
  - `production-auth-smoke` workflow_dispatch run on `main` completes successfully
  - open issue `#108` auto-closed on success path

## Observability and Incident Handling

- Failure:
  - comment added to existing open smoke incident or new issue created if none exists
- Success:
  - open smoke incident(s) auto-closed with success run URL comment

## Rollback Plan

- Revert smoke script/workflow changes and redeploy CI config
- Expected recovery: under 15 minutes
