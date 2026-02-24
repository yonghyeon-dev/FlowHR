# WI-0316: Employee Payslips Locale Dynamic UI Gap Fix Phase 5

## Background

`src/app/employee/payslips/page.tsx` still contained mixed-language copy and
hardcoded `ko-KR` date/time formatting. This caused locale inconsistency in the
employee payslip journey, especially around search/sort and client action logs.

## Scope

- Apply locale-aware runtime formatting in `src/app/employee/payslips/page.tsx`:
  - remove hardcoded `ko-KR` formatting from date/time and KRW render helpers
  - use runtime locale for client action log timestamps
- Add locale dynamic copy wiring for the payslip search/sort panel (`ko`/`en`).
- Add WI-0316 regression test coverage.

## Out of Scope

- API/schema/contract changes
- New payslip business features
- Payslip page decomposition

## Acceptance

1. Payslip page no longer relies on hardcoded `ko-KR` formatting literals.
2. Search/sort panel copy is locale dynamic for Korean/English.
3. WI-0316 regression and build checks pass.

## Notes

- Related issue: `#401`
- Locale gap-fix WI (employee surface)
