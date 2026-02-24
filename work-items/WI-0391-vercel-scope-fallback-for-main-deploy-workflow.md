# WI-0391: Vercel scope fallback for main deploy workflow

## Summary
- Fixed production deploy workflow failure caused by inaccessible `VERCEL_SCOPE` in GitHub Actions.
- Updated `.github/workflows/vercel-production-deploy.yml` to:
  - treat `VERCEL_SCOPE` as optional,
  - try scoped Vercel CLI commands first,
  - retry without `--scope` when scoped access fails.
- Hardened `e2e-wi0390` workflow contract test with scope-fallback assertions.

## Scope
- `.github/workflows/vercel-production-deploy.yml`
- `scripts/tests/e2e-wi0390-vercel-main-deploy-workflow.test.ts`
- `work-items/WI-0391-vercel-scope-fallback-for-main-deploy-workflow.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0390-vercel-main-deploy-workflow.test.ts`
- `npm.cmd run -s typecheck`
