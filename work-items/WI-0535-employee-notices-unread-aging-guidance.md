# WI-0535: Employee Notices Unread-Aging Guidance

## Summary
- Goal: make unread notice delay visible in `/employee/notices` with D+ aging guidance and delayed-acknowledgement badge.
- Scope:
  - `src/components/notices/EmployeeNoticeBoardList.tsx`
  - `src/components/notices/employee-notice-board-helpers.ts`
  - `src/components/notices/copy.ts`
  - `scripts/tests/e2e-wi0535-employee-notices-unread-aging-guidance.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `resolveNoticeUnreadAgingDays` helper for unread notice aging calculation.
- Displayed unread aging (`D+N`) in employee notice list for unread items.
- Added delayed-acknowledgement badge when unread aging is 3 days or more.
- Extended employee notice copy bundle with localized aging labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0535-employee-notices-unread-aging-guidance.test.ts`
