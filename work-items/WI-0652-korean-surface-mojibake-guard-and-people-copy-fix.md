# WI-0652 Korean Surface Mojibake Guard and People Copy Fix

## Summary
- fixed corrupted Korean copy on `src/app/admin/people/page-view.tsx`:
  - title/subtitle
  - refresh button label
  - admin shortcut label
  - KPI labels (`부서`, `API 호출`, `성공`, `실패`)
  - request logs aria label
- added a focused Korean mojibake regression guard test for core customer-facing surfaces:
  - `src/app/admin/people/page-view.tsx`
  - `src/components/withholding-receipt/runtime-label-helpers.ts`
  - `src/components/contracts/runtime-copy-helpers.ts`
  - `src/components/contracts/EmployeeContractsInboxList.tsx`
- strengthened assertions to block previously observed corrupted-token regressions and UTF-8 replacement characters.

## Scope
- UI copy and regression guard test only
- no API/schema/business logic changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0652-korean-surface-mojibake-guard-and-people-copy-fix.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0130-organization-chart-and-hr-history-ui.test.ts`
- `npm.cmd run typecheck`
