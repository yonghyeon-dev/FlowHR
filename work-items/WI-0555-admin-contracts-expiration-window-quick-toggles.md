# WI-0555: Admin Contracts Expiration Window Quick Toggles

## Summary
- Goal: speed up admin contract risk queue switching by adding one-click expiration window toggles.
- Scope:
  - `src/components/contracts/AdminContractsDocumentFilterControls.tsx`
  - `scripts/tests/e2e-wi0555-admin-contracts-expiration-window-quick-toggles.test.ts`
  - `ROADMAP.md`

## Delivery
- Added quick-toggle buttons for expiration window filter (`ALL/7/14/30`).
- Reused existing locale copy labels/options to keep i18n surface stable.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0555-admin-contracts-expiration-window-quick-toggles.test.ts`
