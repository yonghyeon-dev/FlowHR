# WI-0318: Employee Payslips Locale Helper Split Phase 6

## Background

After WI-0316, locale formatting/search copy logic in
`src/app/employee/payslips/page.tsx` still occupied a large inline block.
Keeping locale concerns inside the page reduced readability and slowed future
UI iteration.

## Scope

- Extract payslip locale helper logic into:
  - `src/app/employee/payslips/page-locale-helpers.ts`
- Rewire `src/app/employee/payslips/page.tsx` to consume helper functions.
- Keep behavior unchanged while reducing page density.
- Add WI-0318 regression coverage.

## Out of Scope

- API/schema/contract changes
- New payslip features
- Payroll domain rule changes

## Acceptance

1. Payslip page imports locale helpers from `page-locale-helpers.ts`.
2. Inline locale helper functions are removed from `page.tsx`.
3. WI-0318 regression and build checks pass.

## Notes

- Related issue: `#405`
- UI maintainability/decomposition WI
