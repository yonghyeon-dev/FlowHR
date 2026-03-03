# WI-0842 Admin Contracts Analytics Source Banner

## Summary
- Added analytics-source banner in `/admin/contracts` when opened from `/admin/analytics`.
- Shows focused metric context (`decision queue` / `SLA overdue` / fallback) in the contracts workspace header.
- Added localized ko/en copy and regression guard for source-context rendering.

## Scope
- `src/components/contracts/AdminContractsWorkspace.tsx`
- `src/components/contracts/copy.ts`
- `scripts/tests/e2e-wi0842-admin-contracts-analytics-source-banner.test.ts` (new)

## Acceptance
1. `/admin/contracts?source=admin-analytics` shows source banner.
2. `focusMetric` query maps to readable focused-metric label.
3. Existing contracts workspace behavior remains unchanged when source query is absent.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0842-admin-contracts-analytics-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0833-admin-contracts-deeplink-filter-hydration.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
