# WI-0393: Employee payslips UTF-8 encoding guard

## Summary
- Finalized UTF-8 recovery on `src/app/employee/payslips/page.tsx` after production build failed with invalid UTF-8 bytes.
- Added a regression guard test to block mojibake/corrupted Korean strings from re-entering the payslips page source.
- Kept `.vercel` out of git tracking to avoid local Vercel link artifacts from polluting commits.

## Scope
- `src/app/employee/payslips/page.tsx`
- `.gitignore`
- `scripts/tests/e2e-wi0393-employee-payslips-utf8-encoding-guard.test.ts`
- `work-items/WI-0393-employee-payslips-utf8-encoding-guard.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0393-employee-payslips-utf8-encoding-guard.test.ts`
- `npm.cmd run -s typecheck`
