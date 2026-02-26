# WI-0518: Contract Expiry Renewal Queue Filters

## Summary
- Goal: add expiry/renewal focused queue controls in admin contracts workspace without expanding ops-only infrastructure.
- Scope:
  - `src/components/contracts/useAdminContractsDocumentFilters.ts`
  - `src/components/contracts/AdminContractsDocumentFilterControls.tsx`
  - `src/components/contracts/AdminContractsWorkspace.tsx`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0518-contract-expiry-renewal-queue-filters.test.ts`
  - `ROADMAP.md`

## Delivery
- Added document queue filters:
  - `expirationWindowDays` (`ALL`/`7`/`14`/`30`)
  - `renewalCandidateOnly` toggle (`SIGNED`/`REJECTED`/`EXPIRED`)
- Added queue counters:
  - `expiringSoonCount`
  - `renewalCandidateCount`
- Extended filter controls UI and locale copy for expiry window and renewal-candidate queue management.
- Kept `AdminContractsWorkspace.tsx` line budget under WI-0495 guard (`<=260`).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0518-contract-expiry-renewal-queue-filters.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0496-admin-contracts-document-search-status-filter.test.ts`
- [x] `npm.cmd run typecheck`
