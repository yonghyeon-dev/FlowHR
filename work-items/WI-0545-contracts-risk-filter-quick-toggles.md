# WI-0545: Contracts Risk Filter Quick Toggles

## Summary
- Goal: reduce filter friction in contract risk triage by adding one-tap quick toggles for deadline/SLA risk views.
- Scope:
  - `src/components/contracts/AdminContractsDocumentFilterControls.tsx`
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0545-contracts-risk-filter-quick-toggles.test.ts`
  - `ROADMAP.md`

## Delivery
- Added admin contract document quick-toggle buttons for SLA risk (`ALL`, `DUE_SOON`, `OVERDUE`).
- Added employee contract inbox quick deadline filter actions (`all`, `due_soon`, `overdue`).
- Extended employee contracts copy with quick-toggle labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0545-contracts-risk-filter-quick-toggles.test.ts`

