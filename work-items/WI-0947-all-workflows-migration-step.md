# WI-0947: Add Prisma Migrate Deploy Step to Production Scheduled Workflows Using Production DB

## Background and Problem

Production has pending Prisma migrations. Some production scheduled workflows connect to production DB via `FLOWHR_PRODUCTION_DATABASE_URL`, and can fail when schema drift exists.

Two approval workflows were already updated in WI-0945. Remaining workflows needed verification and coverage.

## Scope

### In Scope

- Check target workflow files:
  - `.github/workflows/production-auth-smoke.yml`
  - `.github/workflows/payroll-phase2-health.yml`
  - `.github/workflows/payroll-phase2-rollback.yml`
  - `.github/workflows/alert-webhook-smoke.yml`
- For workflows that use `FLOWHR_PRODUCTION_DATABASE_URL` and did not already run migration deploy:
  - add step before the main operation step:
    - `Run pending Prisma migrations`
    - `DATABASE_URL: ${{ secrets.FLOWHR_PRODUCTION_DATABASE_URL }}`
    - `DIRECT_URL: ${{ secrets.FLOWHR_PRODUCTION_DIRECT_URL }}`
    - `run: npx prisma migrate deploy`
- Apply changes to:
  - `.github/workflows/production-auth-smoke.yml`
  - `.github/workflows/payroll-phase2-health.yml`

### Out of Scope

- Changes to `ci.yml` migration behavior.
- Changes to approval workflows already fixed in WI-0945.
- New Prisma schema/migration creation.
- Operational logic changes in rollback/webhook workflows that do not use production DB URL secret.

## Operational Notes

- `prisma migrate deploy` is idempotent and safe for repeated scheduled runs.
- Migration step is placed after dependency installation and secret validation, before the workflow main operation.
- `payroll-phase2-rollback.yml` and `alert-webhook-smoke.yml` were reviewed and left unchanged because they do not currently use `FLOWHR_PRODUCTION_DATABASE_URL`.

## Data Changes

- No Prisma schema change.
- No new migration file.
- Runtime deployment of any existing pending migrations in production before scheduled operations execute.

## Test Plan

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- CI workflow validation for updated YAML.
- Post-merge smoke:
  - Trigger `production-auth-smoke` and `payroll-phase2-health` once.
  - Confirm migration step succeeds or reports no pending migrations.
  - Confirm main workflow operation runs successfully.

## Rollback Plan

- Revert WI-0947 workflow edits removing `Run pending Prisma migrations` from:
  - `.github/workflows/production-auth-smoke.yml`
  - `.github/workflows/payroll-phase2-health.yml`
