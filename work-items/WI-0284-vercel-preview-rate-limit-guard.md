# WI-0284: Vercel Preview Rate-Limit Guard

## Background

Recent PR checks reported repeated Vercel deployment failures caused by account build-rate limits.
Core CI checks passed, but preview deployment failures created noisy status and delayed delivery flow.

> Note: Deployment behavior was adjusted in WI-0390 to keep GitHub preview integration disabled
> and move `main` production deployment to GitHub Actions workflow automation.

## Scope

### In Scope

- update `vercel.json` to keep automatic deployment enabled on `main` only
- disable automatic Vercel deployments for non-main branches to reduce preview deployment volume
- minimize preview status noise by suppressing non-main deployments
- add regression test to lock deployment policy contract in repo
- update roadmap tracking for WI-0284

### Out of Scope

- Vercel account plan/limit changes
- production deployment architecture changes
- GitHub Actions workflow redesign

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0284-vercel-preview-rate-limit-guard.test.ts`
- `npm.cmd run typecheck`
