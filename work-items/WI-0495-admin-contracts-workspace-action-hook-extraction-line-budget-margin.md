# WI-0495: Admin Contracts Workspace Action Hook Extraction and Line-Budget Margin

## Summary
- Goal: reduce line-budget risk in `AdminContractsWorkspace` by extracting API/action orchestration into a dedicated hook without adding new i18n scope.
- Scope:
  - `src/components/contracts/AdminContractsWorkspace.tsx`
  - `src/components/contracts/useAdminContractsWorkspaceActions.ts`
  - `scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
  - `scripts/tests/e2e-wi0495-admin-contracts-workspace-action-hook-extraction-line-budget-margin.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted contracts workspace data/action logic to `useAdminContractsWorkspaceActions`:
  - templates/documents reload
  - template create
  - draft document create
  - document lifecycle action dispatch
  - error/message state orchestration
- Converted `AdminContractsWorkspace.tsx` to orchestration/view composition while keeping existing UX anchors and locale wiring.
- Recovered margin against 300-line ceiling:
  - `AdminContractsWorkspace.tsx` now stays well below guardrail.
- Updated legacy regression anchor (`WI-0395`) so `readJson(...)` expectations follow extracted hook location.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0174-admin-contracts-ux-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0335-contracts-locale-dynamic-ui-gap-fix.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0444-contracts-locale-runtime-lock-and-journey-copy.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0472-contracts-employee-id-locale-display-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0495-admin-contracts-workspace-action-hook-extraction-line-budget-margin.test.ts`
- [x] `npm.cmd run typecheck`
