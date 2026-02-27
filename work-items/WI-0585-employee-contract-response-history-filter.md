# WI-0585: Employee Contract Response History Filter

## Summary
- Goal: improve employee contract follow-up by letting users focus on specific response history events.
- Scope:
  - `src/components/contracts/copy.ts`
  - `src/components/contracts/EmployeeContractsResponsePanel.tsx`
  - `scripts/tests/e2e-wi0585-employee-contract-response-history-filter.test.ts`
  - `ROADMAP.md`

## Delivery
- Added locale copy keys (`ko`/`en`) for response history filter controls, visible-count label, and filtered-empty guidance.
- Extended employee contract response history panel with:
  - filter options (`All`, `Signed`, `Rejected`, `Evidence`)
  - filtered visible count (`visible/total`)
  - filter-aware empty guidance
- Kept response panel line budget at `<= 300` to avoid page/component bloat.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0585-employee-contract-response-history-filter.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0584-employee-contract-response-history-panel.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0583-employee-contract-hash-copy-actions.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0582-employee-contract-evidence-metadata-copy-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0581-employee-contract-signature-input-guard.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
