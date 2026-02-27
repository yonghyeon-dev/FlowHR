# WI-0580: Employee Contract Inbox Journey Refinement

## Summary
- Goal: improve employee contract inbox completion flow by surfacing next-action guidance and deadline urgency.
- Scope:
  - `src/components/contracts/copy.ts`
  - `src/components/contracts/employee-inbox-filter-helpers.ts`
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/EmployeeContractsResponsePanel.tsx`
  - `scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
  - `ROADMAP.md`

## Delivery
- Added locale copy keys for employee inbox next-action guidance (`ko`/`en`).
- Added helper functions to calculate due-soon/overdue day distance.
- Enhanced inbox list badges to show urgency as `D-n` and `D+n`.
- Added selected-document next-action guidance panel in response area.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
- [x] `npm.cmd run typecheck`
