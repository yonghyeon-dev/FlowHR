# WI-0660 Vercel Production Scope Context Resolution Root Fix

## Summary
- fixed root cause of repeated `deploy-vercel-production` failures caused by strict scoped-only Vercel CLI calls.
- changed `.github/workflows/vercel-production-deploy.yml` to resolve deployment context in this order:
  1. unscoped token context
  2. configured `VERCEL_SCOPE`
  3. repository-owner scope fallback
- added explicit token-auth validation (`vercel whoami`) before deploy flow.
- improved failure diagnostics to distinguish:
  - context-access errors (`scope-not-accessible`)
  - non-access command errors
- updated workflow regression test and added WI-0660 guard.

## Scope
- CI/deploy workflow hardening only
- no product UI/API/schema changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0390-vercel-main-deploy-workflow.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0660-vercel-production-scope-context-resolution-root-fix.test.ts`
