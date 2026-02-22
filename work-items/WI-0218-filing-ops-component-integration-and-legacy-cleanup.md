# WI-0218: Filing Ops Component Integration and Legacy Cleanup

## Background

`docs/codex-guide.md` Part 1.5 requires de-bloat cleanup for filing ops:

- remove deep-nested `/ops/checklist/**` route chain
- keep only flat step route (`/ops/[step]`)
- remove legacy `PayrollYearEndFilingOps*` / `filing-alert-*` component tree
- archive obsolete WI artifacts and tests to stop phase-loop recurrence

WI-0217 introduced the flat route and shared context baseline.
WI-0218 completes integration by deleting legacy implementation paths.

## Scope

### In Scope

- switch `/admin/payroll-year-end-filing/ops` to redirect into `/ops/alert`
- remove `src/app/admin/payroll-year-end-filing/ops/checklist/**`
- remove legacy filing ops component/helper files:
  - `PayrollYearEndFilingOps*`
  - `filing-alert-*`
- decouple flat components from legacy stylesheet:
  - add `FilingWorkflow.module.css`
- clean admin nav/i18n legacy deep-route entries
- archive obsolete e2e coverage (WI-0198~0199, WI-0201~0216) as no-op placeholders
- add WI-0218 regression to enforce cleanup invariants

### Out of Scope

- introducing new filing ops phases/features
- scheduler/cron/workflow additions
- expanding delivery channels or retry automation

## Implementation Notes

1. Route flattening
- `/ops/page.tsx` now redirects to `/ops/alert`.
- Deep checklist route directory was removed.

2. Component consolidation
- Flat workflow components remain (`FilingDashboard`, `FilingStepPanel`, `FilingGateCard`, `FilingActionLog`, `FilingExportBundle`).
- New shared style module: `FilingWorkflow.module.css`.

3. Legacy archive handling
- WI-0198~0199, WI-0201~0216 work-item docs were marked `DEPRECATED`.
- Related e2e tests were converted into explicit no-op archive placeholders.
- `test:e2e:mvp` and `test:e2e:full` no longer execute archived filing-ops legacy tests.

## Validation

- `npm.cmd run build`
- `npm.cmd exec tsx scripts/tests/e2e-wi0217-filing-ops-flat-workflow-route-context-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0218-filing-ops-component-integration-and-legacy-cleanup.test.ts`

