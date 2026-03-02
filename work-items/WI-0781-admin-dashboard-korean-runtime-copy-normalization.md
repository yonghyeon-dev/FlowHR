# WI-0781 Admin Dashboard Korean Runtime Copy Normalization

## Summary
- normalized corrupted Korean runtime copy on `/admin` dashboard.
- updated Korean labels/messages for:
  - dashboard header/title/subtitle
  - loading/refresh/login actions
  - production login-required warning
  - priority queue summary and severity labels
  - KPI card labels
  - workspace section titles/descriptions/button labels
- kept English runtime copy unchanged.

## Scope
- core product UX copy normalization only
- no scheduler/ops expansion
- no phase-style layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0665-admin-dashboard-priority-focus-cards-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0666-admin-dashboard-priority-copy-normalization-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0781-admin-dashboard-korean-runtime-copy-normalization.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
