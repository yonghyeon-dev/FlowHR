# WI-0542: Employee Contracts Risk-Priority Sort and Badge

## Summary
- Goal: surface urgent contract responses first in employee inbox by prioritizing deadline risk in list ordering.
- Scope:
  - `src/components/contracts/employee-inbox-filter-helpers.ts`
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0542-employee-contracts-risk-priority-sort-and-badge.test.ts`
  - `ROADMAP.md`

## Delivery
- Added helper-level risk classifiers (`isDueSoonPendingDocument`, `isOverduePendingDocument`).
- Added inbox sort helper (`sortInboxDocumentsByRisk`) that orders overdue and due-soon pending contracts first.
- Applied risk-priority sort to filtered inbox results.
- Added per-item risk badges in employee inbox rows.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0525-employee-contracts-deadline-risk-queue.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0542-employee-contracts-risk-priority-sort-and-badge.test.ts`

