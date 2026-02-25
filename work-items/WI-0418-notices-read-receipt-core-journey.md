# WI-0418: Notices Read Receipt Core Journey

## Summary
- Goal: close the employee notice journey loop from "list" to "acknowledged read".
- Change:
  - Added notice read-receipt model and store handlers:
    - `listNoticeReadReceipts`
    - `markNoticeRead`
  - Extended notices API response (`GET /api/notices`) with:
    - `readReceipts`
    - `readNoticeIds`
  - Added read endpoint:
    - `POST /api/notices/{noticeId}/read`
  - Updated employee notice board:
    - unread count
    - per-notice read/unread badge
    - mark-as-read action
    - read timestamp rendering
- Outcome:
  - Employee can acknowledge published notices in-product.
  - API now exposes read-state payload needed for both employee and admin surfaces.

## Scope
- `src/features/notices/types.ts`
- `src/features/notices/schemas.ts`
- `src/features/notices/store.ts`
- `src/app/api/notices/route.ts`
- `src/app/api/notices/[noticeId]/read/route.ts`
- `src/components/notices/copy.ts`
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `scripts/tests/e2e-wi0418-notices-read-receipt-core-journey.test.ts`
- `work-items/WI-0418-notices-read-receipt-core-journey.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0418-notices-read-receipt-core-journey.test.ts`

