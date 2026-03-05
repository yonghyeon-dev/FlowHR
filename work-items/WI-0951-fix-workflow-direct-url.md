# WI-0951: Fix Workflow Prisma Migrate DIRECT_URL

## Background and Problem

Scheduled production workflows fail at Prisma migration deploy because
`FLOWHR_PRODUCTION_DIRECT_URL` resolves to a direct Supabase host that is not
reachable from GitHub Actions runners.

## Scope

### In Scope

- Update workflow migration steps to use pooler `FLOWHR_PRODUCTION_DATABASE_URL`
  for both `DATABASE_URL` and `DIRECT_URL` during `npx prisma migrate deploy`.
- Apply change in:
  - `.github/workflows/approval-delegation-expiry.yml`
  - `.github/workflows/approval-execution-escalation.yml`
  - `.github/workflows/production-auth-smoke.yml`
  - `.github/workflows/payroll-phase2-health.yml`

### Out of Scope

- Changing non-migration workflow steps that currently consume
  `FLOWHR_PRODUCTION_DIRECT_URL`.
- Rotating or renaming GitHub secrets.

## Rollback Plan

- Revert workflow edits in this work item to restore previous
  `FLOWHR_PRODUCTION_DIRECT_URL` mapping for migration steps.