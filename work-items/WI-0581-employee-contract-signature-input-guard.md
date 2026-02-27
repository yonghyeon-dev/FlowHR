# WI-0581: Employee Contract Signature Input Guard

## Summary
- Goal: prevent invalid sign submissions by requiring signature input before employee contract sign action.
- Scope:
  - `src/components/contracts/copy.ts`
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/EmployeeContractsResponsePanel.tsx`
  - `scripts/tests/e2e-wi0581-employee-contract-signature-input-guard.test.ts`
  - `ROADMAP.md`

## Delivery
- Added locale copy keys for signature-input placeholder, inline hint, and pre-submit error (`ko`/`en`).
- Added `SIGN` pre-submit guard in inbox action flow to stop empty signature submissions before API call.
- Added response panel UX guard:
  - sign button is disabled until signature input is provided.
  - inline hint is shown when response is allowed but signature input is empty.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0581-employee-contract-signature-input-guard.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
