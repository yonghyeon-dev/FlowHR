# WI-0834 Employee Contracts Deeplink Filter Hydration

## Summary
- Added query-based initial filter hydration to `/employee/contracts`.
- Added reusable normalizers for employee contracts inbox status/deadline/search filters.
- Wired deeplink query keys for employee contract queue triage.

## Scope
- `src/components/contracts/EmployeeContractsInbox.tsx`
- `src/components/contracts/employee-inbox-filter-helpers.ts`
- `scripts/tests/e2e-wi0834-employee-contracts-deeplink-filter-hydration.test.ts` (new)

## Acceptance
1. `/employee/contracts` reads deeplink query params on first load and applies them as initial filter state.
2. Supported query keys: `q`, `status`, `deadline`.
3. Employee inbox filter normalization helpers are exported and covered by WI regression assertions.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0834-employee-contracts-deeplink-filter-hydration.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0833-admin-contracts-deeplink-filter-hydration.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
