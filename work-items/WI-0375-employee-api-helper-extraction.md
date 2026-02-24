# WI-0375: Employee API helper extraction

## Summary
- Extracted employee self-service API request parsing/header logic into `src/app/employee/page-api-helpers.ts`.
- Rewired `src/app/employee/page.tsx` `callApi` to delegate to `performEmployeeApiCall`.
- Kept runtime locale timestamp logging behavior while reducing `page.tsx` inline networking logic.

## Scope
- `src/app/employee/page.tsx`
- `src/app/employee/page-api-helpers.ts`
- `scripts/tests/e2e-wi0375-employee-api-helper-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0375-employee-api-helper-extraction.test.ts`
- `npm.cmd run -s typecheck`
