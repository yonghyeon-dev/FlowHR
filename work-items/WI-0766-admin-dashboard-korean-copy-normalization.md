# WI-0766 Admin Dashboard Korean Copy Normalization

## Summary
- normalized corrupted Korean runtime copy in `src/app/admin/page.tsx`.
- normalized admin dashboard priority/focus copy in `src/app/admin/page-focus-copy.ts`.
- updated copy normalization regression guard to validate readable Korean strings and block previous mojibake tokens.

## Scope
- admin dashboard copy quality bug fix only
- no API/domain/schema/model change
- no ops/devtools scope expansion

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0665-admin-dashboard-priority-focus-cards-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0666-admin-dashboard-priority-copy-normalization-guard.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
