# WI-0454: Admin Approval Policy Type/Utility Extraction (Line Budget 500)

## Summary
- Goal: Keep `src/app/admin/approval-policy/page.tsx` under 500 lines by extracting shared types and small utilities.
- Scope:
  - Extract page-local DTO/type definitions to a dedicated module.
  - Extract reusable utility helpers (`isTruthyFlag`, `toLocalInputValue`, `toIso`) to the same module.
  - Keep page behavior unchanged.

## Delivery
- Added `src/app/admin/approval-policy/page-types.ts`
  - `ApprovalDomain`, `ApprovalPolicyDto`, `ApprovalDelegationDto`, `ApprovalDelegationExpireResultDto`, `ApiLog`
  - `domainOptions`, `isTruthyFlag`, `toLocalInputValue`, `toIso`
- Updated `src/app/admin/approval-policy/page.tsx`
  - Removed in-file type/utility duplicates.
  - Imported extracted symbols from `page-types.ts`.
  - Line count reduced to 456.
- Added `scripts/tests/e2e-wi0454-admin-approval-policy-type-utility-extraction-line-budget-500.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0454-admin-approval-policy-type-utility-extraction-line-budget-500.test.ts`
