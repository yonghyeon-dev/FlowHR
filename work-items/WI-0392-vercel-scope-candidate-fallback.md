# WI-0392: Vercel scope-candidate fallback

## Summary
- Hardened `vercel-production-deploy` workflow to try multiple Vercel scope candidates:
  - configured `VERCEL_SCOPE`,
  - `GITHUB_REPOSITORY_OWNER` fallback.
- Added explicit failure diagnostics listing all attempted scopes when deploy cannot authenticate.
- Updated `e2e-wi0390` workflow contract test for the new scope-candidate logic.

## Scope
- `.github/workflows/vercel-production-deploy.yml`
- `scripts/tests/e2e-wi0390-vercel-main-deploy-workflow.test.ts`
- `work-items/WI-0392-vercel-scope-candidate-fallback.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0390-vercel-main-deploy-workflow.test.ts`
- `npm.cmd run -s typecheck`
