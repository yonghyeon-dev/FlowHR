# WI-0586: Employee Contract Response History Status Summary

## Summary
- Goal: improve response-history readability in employee contracts by exposing event-type counts directly in the response panel.
- Scope:
  - `src/components/contracts/EmployeeContractsResponsePanel.tsx`
  - `scripts/tests/e2e-wi0586-employee-contract-response-history-status-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added derived response-history counters (`SIGNED` / `REJECTED` / `EVIDENCE`) in the employee contract response panel.
- Updated history filter controls to show count badges in button text (`label (count)`).
- Added status summary row under the visible-count line for quick event distribution checks.
- Kept `EmployeeContractsResponsePanel.tsx` within line budget (`<= 300`).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0586-employee-contract-response-history-status-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0585-employee-contract-response-history-filter.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0584-employee-contract-response-history-panel.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0583-employee-contract-hash-copy-actions.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0582-employee-contract-evidence-metadata-copy-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0581-employee-contract-signature-input-guard.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
