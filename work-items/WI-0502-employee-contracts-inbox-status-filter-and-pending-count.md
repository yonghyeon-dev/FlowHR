# WI-0502: Employee Contracts Inbox Status Filter and Pending Count

## Summary
- Goal: improve employee contract response speed by adding status-based filtering and pending-response visibility in `/employee/contracts`.
- Scope:
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0502-employee-contracts-inbox-status-filter-and-pending-count.test.ts`
  - `ROADMAP.md`

## Delivery
- Added inbox status filter options:
  - all statuses
  - pending response
  - responded
  - expired
- Combined status filter + text search on the contract list.
- Added pending-response count in the list summary row.
- Kept line-budget guardrail:
  - `EmployeeContractsInbox.tsx` remains <= 300 lines.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0438-employee-contracts-inbox-search-filter.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0502-employee-contracts-inbox-status-filter-and-pending-count.test.ts`
- [x] `npm.cmd run typecheck`
