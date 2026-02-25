# WI-0407: Notices Core Journey Implementation

## Summary
- Goal: move notices domain from baseline placeholder to an end-to-end core journey for admin compose/publish and employee read.
- Change:
  - Added notices domain in-memory store (`list/create/publish`) with seeded items.
  - Added API routes: `GET/POST /api/notices`, `POST /api/notices/{noticeId}/publish` with role gate (`admin/manager`).
  - Replaced `/admin/notices` baseline page with `AdminNoticeWorkspace` (compose, filter, publish, log).
  - Added `/employee/notices` route with `EmployeeNoticeBoard` for published notices.
  - Added employee sidebar/nav i18n wiring for notices (`employee.nav.notices`).
  - Updated WI-0399 regression to follow componentized notices page contract.
- Outcome:
  - Notices now has a usable core loop: compose -> save/schedule -> publish -> employee read.

## Scope
- `src/features/notices/types.ts`
- `src/features/notices/store.ts`
- `src/features/notices/schemas.ts`
- `src/app/api/notices/route.ts`
- `src/app/api/notices/[noticeId]/publish/route.ts`
- `src/components/notices/copy.ts`
- `src/components/notices/AdminNoticeWorkspace.tsx`
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `src/app/admin/notices/page.tsx`
- `src/app/employee/notices/page.tsx`
- `src/app/employee/layout.tsx`
- `src/lib/i18n/messages.ts`
- `scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- `scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- `work-items/WI-0407-notices-core-journey-implementation.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- `npm.cmd run -s build`
