# WI-0395: Contracts Korean copy residual cleanup and localized request fallback

## Summary
- Target surface: `전자계약함` (admin contracts workspace + template builder + employee contracts inbox).
- Removed residual English terminology on ko locale where user-facing labels still showed `ID` wording.
- Localized generic request-failure fallback handling in contracts components so ko locale no longer exposes raw english fallback (`request failed (...)`) when API response body has no explicit error message.
- Added regression guard to keep ko terminology and localized fallback wiring stable.

## Scope
- `src/components/contracts/copy.ts`
- `src/components/contracts/http.ts`
- `src/components/contracts/AdminContractsWorkspace.tsx`
- `src/components/contracts/EmployeeContractsInbox.tsx`
- `src/components/contracts/ContractTemplateBuilder.tsx`
- `scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- `work-items/WI-0395-contracts-korean-copy-and-error-fallback.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0335-contracts-locale-dynamic-ui-gap-fix.test.ts`
- `npm.cmd run -s typecheck`
