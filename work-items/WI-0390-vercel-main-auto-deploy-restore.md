# WI-0390: Vercel main auto-deploy restore

## Summary
- Kept Vercel GitHub integration disabled in `vercel.json` to block preview deployment noise/failures on PR branches.
- Added a dedicated GitHub Actions workflow (`.github/workflows/vercel-production-deploy.yml`) that deploys to Vercel only on `push` to `main` (plus manual `workflow_dispatch` fallback).
- Preserved preview-rate protection from WI-0284:
  - `git.deploymentEnabled.main = true`
  - `git.deploymentEnabled["*"] = false`
- Added deployment policy regression coverage in `e2e-wi0390` and wired it into e2e script bundles.

## Scope
- `vercel.json`
- `.github/workflows/vercel-production-deploy.yml`
- `scripts/tests/e2e-wi0284-vercel-preview-rate-limit-guard.test.ts`
- `scripts/tests/e2e-wi0390-vercel-main-deploy-workflow.test.ts`
- `package.json`
- `work-items/WI-0284-vercel-preview-rate-limit-guard.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0284-vercel-preview-rate-limit-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0390-vercel-main-deploy-workflow.test.ts`
- `npm.cmd run -s typecheck`
