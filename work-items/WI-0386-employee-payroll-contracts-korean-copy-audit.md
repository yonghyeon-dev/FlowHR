# WI-0386: Employee payroll/contracts Korean copy exhaustive audit

## Summary
- Completed an exhaustive Korean copy audit for the user-reported areas:
  - withholding receipt (`원천징수`)
  - payslip + payslip receipts (`명세서`)
  - employee contracts inbox (`전자계약함`)
- Removed remaining mixed English UI strings in `ko` branches and replaced hardcoded labels with locale copy bindings.
- Standardized KRW rendering so Korean locale uses `원` and English locale uses `KRW`.
- Added a regression audit test to prevent reintroduction of known residual English patterns in Korean copy blocks.

## Scope
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `src/components/withholding-receipt/types.ts`
- `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
- `src/components/payslip-receipts/copy.ts`
- `src/components/payslip-receipts/types.ts`
- `src/app/employee/payslips/page-locale-helpers.ts`
- `src/app/employee/payslips/page.tsx`
- `src/components/contracts/copy.ts`
- `scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
- `npm.cmd run -s typecheck`
