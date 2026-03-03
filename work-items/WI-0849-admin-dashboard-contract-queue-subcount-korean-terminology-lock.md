# WI-0849 Admin Dashboard Contract Queue Subcount Korean Terminology Lock

## Summary
- Normalized Korean contract queue breakdown labels in admin dashboard badge annotation.
- Replaced compact terms (`응답대기`, `SLA초과`) with spaced product labels (`응답 대기`, `SLA 초과`).
- Added regression guard to prevent old compact terminology from reappearing.

## Scope
- `src/app/admin/page.tsx`
- `scripts/tests/e2e-wi0848-admin-dashboard-contract-queue-subcount-annotation.test.ts`
- `scripts/tests/e2e-wi0849-admin-dashboard-contract-queue-subcount-korean-terminology-lock.test.ts` (new)

## Acceptance
1. Admin contract queue breakdown uses `응답 대기` and `SLA 초과` in Korean runtime.
2. Previous compact terms do not appear in dashboard breakdown string.
3. Existing queue count logic and English labels remain unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0849-admin-dashboard-contract-queue-subcount-korean-terminology-lock.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0848-admin-dashboard-contract-queue-subcount-annotation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0847-admin-dashboard-contract-pending-response-queue-badge-balance.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
