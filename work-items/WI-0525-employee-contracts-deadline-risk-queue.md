# WI-0525: Employee Contracts Deadline Risk Queue

## Summary
- Goal: help employees prioritize contract responses by exposing near-deadline and overdue items.
- Scope:
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/EmployeeContractsResponsePanel.tsx`
  - `src/components/contracts/employee-inbox-filter-helpers.ts`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0525-employee-contracts-deadline-risk-queue.test.ts`
  - `ROADMAP.md`

## Delivery
- Added deadline risk filter in employee contracts inbox:
  - `all`
  - `due_soon` (within D-3)
  - `overdue`
- Added due-soon and overdue summary counters in inbox KPI row.
- Extracted response detail block to `EmployeeContractsResponsePanel` to keep inbox line budget safe.
- Added dedicated inbox filtering helpers for status/deadline rules.
- Kept `EmployeeContractsInbox.tsx` under line budget (`<= 300`).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0525-employee-contracts-deadline-risk-queue.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0502-employee-contracts-inbox-status-filter-and-pending-count.test.ts`
- [x] `npm.cmd run typecheck`

