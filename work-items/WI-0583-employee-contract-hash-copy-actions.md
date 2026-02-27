# WI-0583: Employee Contract Hash Copy Actions

## Summary
- Goal: improve signed-contract evidence handling by letting employees quickly copy signature/evidence hashes.
- Scope:
  - `src/components/contracts/copy.ts`
  - `src/components/contracts/EmployeeContractsResponsePanel.tsx`
  - `scripts/tests/e2e-wi0583-employee-contract-hash-copy-actions.test.ts`
  - `ROADMAP.md`

## Delivery
- Added locale copy keys (`ko`/`en`) for:
  - signature hash copy action
  - evidence hash copy action
  - copy success/error statuses
- Added hash copy buttons in employee contract response detail panel.
- Added local clipboard status handling in response panel:
  - success message after copy
  - explicit fallback error when clipboard API is unavailable/fails.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0583-employee-contract-hash-copy-actions.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0582-employee-contract-evidence-metadata-copy-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0581-employee-contract-signature-input-guard.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
