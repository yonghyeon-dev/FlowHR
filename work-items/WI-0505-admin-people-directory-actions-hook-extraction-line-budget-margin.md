# WI-0505: Admin People Directory Actions Hook Extraction and Line-Budget Margin

## Summary
- Goal: reduce `src/app/admin/people/page.tsx` orchestration bloat by extracting directory API action runtime into a dedicated hook.
- Scope:
  - `src/app/admin/people/page.tsx`
  - `src/app/admin/people/page-directory-actions.ts`
  - `scripts/tests/e2e-wi0505-admin-people-directory-actions-hook-extraction-line-budget-margin.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `useAdminPeopleDirectoryActions` hook in `page-directory-actions.ts`:
  - request wrapper (`callApi`)
  - organizations/departments/positions/employees load actions
  - directory refresh action
  - employee history load action
  - employee profile update action
  - API log stats summary
- Rewired `admin/people/page.tsx` to consume the hook and removed in-file action orchestration block.
- Line-budget recovery:
  - `admin/people/page.tsx`: 499 -> 377
  - `admin/people/page-directory-actions.ts`: 251

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0396-payslip-copy-regression-reversal-and-people-page-decomposition.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0455-admin-people-page-view-panel-decomposition-line-budget-300.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0505-admin-people-directory-actions-hook-extraction-line-budget-margin.test.ts`
- [x] `npm.cmd run typecheck`
