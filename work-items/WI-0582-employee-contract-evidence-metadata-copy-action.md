# WI-0582: Employee Contract Evidence Metadata Copy Action

## Summary
- Goal: improve signed-contract follow-up by allowing users to copy evidence metadata directly from the response panel.
- Scope:
  - `src/components/contracts/copy.ts`
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/EmployeeContractsResponsePanel.tsx`
  - `scripts/tests/e2e-wi0582-employee-contract-evidence-metadata-copy-action.test.ts`
  - `ROADMAP.md`

## Delivery
- Added locale copy keys (`ko`/`en`) for evidence metadata copy action/status/error.
- Added response-panel action button to copy signature evidence metadata.
- Added inbox clipboard handler:
  - builds localized metadata text (file name, generated time, SHA256)
  - writes to clipboard
  - surfaces success/error through existing message/error feedback channel.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0582-employee-contract-evidence-metadata-copy-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0581-employee-contract-signature-input-guard.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
