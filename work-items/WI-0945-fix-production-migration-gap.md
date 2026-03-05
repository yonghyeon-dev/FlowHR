# WI-0945: Fix Production Migration Gap for Approval Schedulers

## Background and Problem

Production approval schedulers fail with Prisma errors because the production database schema is behind Prisma schema.
`Organization.businessRegistrationNumber` exists in Prisma schema, but migration `202603050003_wi0922_onboarding_wizard` was not applied in production.

This impacts:
- `approval-delegation-expiry` (issue `#838`)
- `approval-execution-escalation` (issue `#840`)

## Scope

### In Scope

- Update `.github/workflows/approval-delegation-expiry.yml`:
  - add `Run pending migrations` step before `Run approval delegation expiry sweep`
  - run `npx prisma migrate deploy`
  - provide production `DATABASE_URL` and `DIRECT_URL` env vars from secrets
- Update `.github/workflows/approval-execution-escalation.yml`:
  - add `Run pending migrations` step before `Run approval execution escalation sweep`
  - run `npx prisma migrate deploy`
  - provide production `DATABASE_URL` and `DIRECT_URL` env vars from secrets
- Ensure each scheduled run self-heals missing production migrations before operational scripts execute.

### Out of Scope

- Manual one-off production DB patch scripts.
- Changing business logic in approval delegation expiry/escalation scripts.
- Altering migration contents for `202603050003_wi0922_onboarding_wizard`.

## Operational Notes

- `prisma migrate deploy` is idempotent and safe for repeated scheduled execution.
- Secret validation already exists and remains unchanged.
- Migration deploy is executed after dependency install and before the main ops step.

## Data Changes

- No new Prisma schema change.
- No new migration created.
- Runtime application of existing pending migration(s), including:
  - `202603050003_wi0922_onboarding_wizard`

## Test Plan

- Run repo checks:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
- Validate workflow YAML syntax by CI on PR.
- Post-merge operational validation:
  - Trigger both workflows once via `workflow_dispatch`.
  - Confirm migration step succeeds or reports "No pending migrations to apply".
  - Confirm sweep step runs without missing-column errors for `businessRegistrationNumber`.

## Rollback Plan

- Remove `Run pending migrations` step from both workflows.
- Revert WI-0945 changes in a follow-up PR if migration deploy in scheduler is not desired.
