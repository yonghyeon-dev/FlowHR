# WI-0301: Employee/Admin Locale Dynamic UI Gap Fix Phase 2

## Background

`/employee` and `/admin` still exposed several hardcoded English UI labels
(`PASS/FAIL/EMPTY/APPLIED/HOLIDAY/WORK`, invite role/delivery labels).
This created locale inconsistency for Korean-first production usage.

## Scope

- `src/app/employee/page.tsx`
  - bind locale via `useI18n`
  - localize status/badge/work-type/log labels
  - localize leave type display in key list/timeline rows
- `src/app/employee/page-types.ts`
  - tighten `RequestFeedbackRow.status` type to request-status union
- `src/app/admin/page.tsx`
  - localize invite role/delivery option labels
  - localize invite result role/delivery display labels

## Out of Scope

- API/contract/domain behavior changes
- New ops workflows or preset layering extensions
- Large-page decomposition itself (handled in follow-up WI)

## Acceptance

1. Remaining hardcoded English labels are replaced by locale-aware UI labels in employee/admin pages.
2. Invite role/delivery option values stay stable while visible labels are localized.
3. Typecheck/build and WI regression test pass.

## Notes

- Related issue: `#371`
- UI-only enhancement (no contract version bump required)
