# WI-0438: Employee Contracts Inbox Search Filter

## Summary
- Goal: improve employee contracts self-service navigation with local inbox search.
- Scope:
  - add inbox search by title/document ID/status/comment
  - add clear-search action
  - add visible document count and filtered-empty message
  - keep detail/respond/signature evidence flow unchanged.

## Delivery
- Updated `src/components/contracts/EmployeeContractsInbox.tsx`
  - added `searchQuery` state and normalized search derivation
  - added `filteredDocuments` memo with local search matching for:
    - `document.id`
    - `document.title`
    - `document.status`
    - `document.approvalStatus`
    - `document.responseComment`
  - changed list rendering source from `documents` to `filteredDocuments`
  - added search input, clear action, visible count label, and filtered-empty state.
- Updated `src/components/contracts/copy.ts`
  - added ko/en copy keys:
    - `inboxSearchLabel`
    - `inboxSearchPlaceholder`
    - `clearSearchAction`
    - `visibleCountLabel`
    - `inboxFilteredEmpty`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0352-employee-contract-signature-journey-status-timeline-recovery-guide.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0438-employee-contracts-inbox-search-filter.test.ts`
