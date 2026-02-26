# WI-0530: Contract Template Builder Draft Validation Checklist

## Summary
- Goal: prevent invalid draft template creation by introducing a checklist gate in contract template builder.
- Scope:
  - `src/components/contracts/ContractTemplateBuilder.tsx`
  - `src/components/contracts/template-builder-checklist.tsx`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0530-contract-template-builder-draft-validation-checklist.test.ts`
  - `ROADMAP.md`

## Delivery
- Added draft validation checklist rules:
  - template name length
  - at least one clause with title/body
  - at least one required clause
  - no duplicate clause titles
- Added checklist status panel in builder and disabled create action when not ready.
- Added explicit validation fail message before API call.
- Extracted checklist logic/UI into `template-builder-checklist.tsx` to keep builder within line budget.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0174-admin-contracts-ux-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0530-contract-template-builder-draft-validation-checklist.test.ts`

