# WI-0591: Employee Contracts Action Needed Queue Visibility

## Summary
- Goal: let employees focus only on contract documents that need immediate action.
- Scope:
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/employee-inbox-filter-helpers.ts`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0591-employee-contracts-action-needed-queue-visibility.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `action_needed` deadline filter for employee contracts inbox:
  - includes pending-response documents that are due soon or overdue
- Added quick toggle action for the new filter.
- Added action-needed summary count in inbox metrics.
- Kept inbox line budget within guardrail (`EmployeeContractsInbox.tsx <= 300`).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0591-employee-contracts-action-needed-queue-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0586-employee-contract-response-history-status-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0545-contracts-risk-filter-quick-toggles.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0542-employee-contracts-risk-priority-sort-and-badge.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0502-employee-contracts-inbox-status-filter-and-pending-count.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
