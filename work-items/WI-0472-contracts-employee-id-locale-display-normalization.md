# WI-0472: Contracts Employee ID Locale Display Normalization

## Summary
- Goal: make employee-id rendering/input in contracts admin workflow locale-friendly for Korean UI, without breaking API compatibility.
- Scope:
  - `/admin/contracts` employee-id input and document list rendering
  - Existing locale employee-id helper reuse

## Delivery
- Updated `src/lib/i18n/employee-id-locale.ts`
  - Added `formatEmployeeIdForLocaleDisplay(value, locale)` for locale-safe visible labels.
- Updated `src/components/contracts/AdminContractsWorkspace.tsx`
  - Applied `normalizeEmployeeIdForApi` for draft-document API payload.
  - Applied `normalizeEmployeeIdForLocaleInput` to sync input shape on locale change.
  - Applied `formatEmployeeIdForLocaleDisplay` to:
    - Draft title composition
    - Document list employee-id rendering
  - Removed direct `employeeId.trim()` payload mapping to avoid locale-display/API-format drift.
- Added regression test:
  - `scripts/tests/e2e-wi0472-contracts-employee-id-locale-display-normalization.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0335-contracts-locale-dynamic-ui-gap-fix.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0472-contracts-employee-id-locale-display-normalization.test.ts`
