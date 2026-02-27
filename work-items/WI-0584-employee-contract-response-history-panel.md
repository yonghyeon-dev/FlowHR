# WI-0584: Employee Contract Response History Panel

## Summary
- Goal: make contract response follow-up clearer by showing recent response history in the employee response panel.
- Scope:
  - `src/components/contracts/copy.ts`
  - `src/components/contracts/EmployeeContractsResponsePanel.tsx`
  - `scripts/tests/e2e-wi0584-employee-contract-response-history-panel.test.ts`
  - `ROADMAP.md`

## Delivery
- Added locale copy keys (`ko`/`en`) for response history panel title, empty text, and event labels.
- Added `Recent Response History` section in employee contract response panel:
  - signed response event
  - rejected response event
  - evidence-loaded event
- Added descending time sort for history entries and reused runtime date formatting.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0584-employee-contract-response-history-panel.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0583-employee-contract-hash-copy-actions.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0582-employee-contract-evidence-metadata-copy-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0581-employee-contract-signature-input-guard.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
