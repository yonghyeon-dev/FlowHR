# WI-0546: Employee Notices Unread Aging Risk Filter and Summary

## Summary
- Goal: help employees focus on delayed unread notices by adding an aging-risk filter and summary count.
- Scope:
  - `src/components/notices/EmployeeNoticeBoard.tsx`
  - `src/components/notices/employee-notice-board-helpers.ts`
  - `src/components/notices/copy.ts`
  - `scripts/tests/e2e-wi0546-employee-notices-unread-aging-risk-filter-and-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added unread aging-risk filter(`all`/`aging_3d`) to employee notices.
- Added unread aging-risk summary metric and filter copy for ko/en locales.
- Extended notice helpers with aging-risk normalization and filter logic.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0546-employee-notices-unread-aging-risk-filter-and-summary.test.ts`
