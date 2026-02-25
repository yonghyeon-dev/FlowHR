# WI-0423: Notices Mark-All-Read Core Journey

## Summary
- Goal: let employees clear unread notices in one action.
- Change:
  - Added notice read-all schema and store capability for published notices.
  - Added `POST /api/notices/read-all` endpoint with actor-aware audience scope.
  - Updated employee notice board with `전체 확인 처리` action and localized log-count label.
- Outcome:
  - Employees can process unread notices in one click instead of per-item repetition.

## Scope
- `src/features/notices/schemas.ts`
- `src/features/notices/store.ts`
- `src/app/api/notices/read-all/route.ts`
- `src/components/notices/copy.ts`
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `scripts/tests/e2e-wi0423-notices-mark-all-read-core-journey.test.ts`
- `work-items/WI-0423-notices-mark-all-read-core-journey.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0418-notices-read-receipt-core-journey.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0423-notices-mark-all-read-core-journey.test.ts`
