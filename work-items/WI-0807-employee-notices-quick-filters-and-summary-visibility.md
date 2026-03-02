# WI-0807 Employee Notices Quick Filters and Summary Visibility

## Summary
- Add quick filter actions on `/employee/notices` so employees can switch immediately between `all`, `unread`, and `aging >= 3d` notice queues.
- Show quick-filter counts directly on action buttons for faster action prioritization.
- Improve summary readability by replacing broken separator rendering and surfacing read-count visibility.

## Scope
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `scripts/tests/e2e-wi0807-employee-notices-quick-filters-and-summary-visibility.test.ts`
- `ROADMAP.md`

## Implementation Notes
- Added quick-filter state indicators:
  - `isAllQuickFilter`
  - `isUnreadQuickFilter`
  - `isAgingRiskQuickFilter`
- Added quick-filter handlers:
  - `applyAllQuickFilter`
  - `applyUnreadQuickFilter`
  - `applyAgingRiskQuickFilter`
- Added action buttons with live counts:
  - All (`notices.length`)
  - Unread (`unreadCount`)
  - Aging risk (`unreadAgingRiskCount`)
- Updated summary line to include read count and stable `/` separators.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0807-employee-notices-quick-filters-and-summary-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0527-employee-notice-read-status-filter-and-line-budget.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0535-employee-notices-unread-aging-guidance.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0546-employee-notices-unread-aging-risk-filter-and-summary.test.ts`

## Risks
- Minimal UI-only impact on employee notices filter behavior.
- No API or contract changes.
