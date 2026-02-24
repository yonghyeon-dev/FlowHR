# WI-0390: Vercel main auto-deploy restore

## Summary
- Restored Vercel GitHub integration in `vercel.json` so commits merged to `main` can auto-deploy again.
- Kept preview-rate protection from WI-0284:
  - `git.deploymentEnabled.main = true`
  - `git.deploymentEnabled["*"] = false`
- Updated the deployment policy regression test to enforce the restored `main` auto-deploy contract.

## Scope
- `vercel.json`
- `scripts/tests/e2e-wi0284-vercel-preview-rate-limit-guard.test.ts`
- `work-items/WI-0284-vercel-preview-rate-limit-guard.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0284-vercel-preview-rate-limit-guard.test.ts`
- `npm.cmd run -s typecheck`
