# WI-0537: Employee Benefits Annual-Limit Remaining Preview

## Summary
- Goal: provide pre-submit limit visibility in `/employee/benefits` so employees can understand projected remaining budget before request submission.
- Scope:
  - `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
  - `src/components/benefits/copy.ts`
  - `scripts/tests/e2e-wi0537-employee-benefits-annual-limit-remaining-preview.test.ts`
  - `ROADMAP.md`

## Delivery
- Added selected-benefit usage aggregation (`SUBMITTED` + `APPROVED`) for the current benefit.
- Added estimated remaining limit after current draft amount input.
- Added over-limit warning message for projected negative remaining amount.
- Extended employee benefits copy bundle with localized usage/remaining/warning labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0537-employee-benefits-annual-limit-remaining-preview.test.ts`
