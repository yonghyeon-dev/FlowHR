# WI-0419: Benefits Request Filter and Name Visibility

## Summary
- Goal: improve employee benefits request readability and decision tracking.
- Change:
  - Employee benefits workspace now supports request status filtering (`all/submitted/approved/rejected`).
  - Added status summary counts in employee workspace.
  - Resolved `benefitId` to catalog name in request history for human-readable rows.
  - Extended locale copy for filter labels/summary/fallback name.
- Outcome:
  - Employees can narrow request history by status and understand request rows without raw IDs.

## Scope
- `src/components/benefits/copy.ts`
- `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
- `scripts/tests/e2e-wi0419-benefits-request-filter-and-name-visibility.test.ts`
- `work-items/WI-0419-benefits-request-filter-and-name-visibility.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0408-benefits-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0419-benefits-request-filter-and-name-visibility.test.ts`

