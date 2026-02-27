# WI-0587: Korean Surface One-Shot Guard (Withholding/Payslips/Contracts)

## Summary
- Goal: lock Korean UI text quality for core employee surfaces (withholding receipt, payslips, contracts) with a one-shot regression guard.
- Scope:
  - `src/components/contracts/copy.ts`
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `scripts/tests/e2e-wi0587-korean-surface-one-shot-guard-withholding-payslips-contracts.test.ts`
  - `ROADMAP.md`

## Delivery
- Normalized employee contracts KO inbox search label to direct Korean literal (`받은함 검색`).
- Fixed withholding receipt locale-copy alignment for KO/EN document action labels.
- Added one-shot Korean surface guard test that locks:
  - contracts KO inbox/history filter labels
  - withholding KO document action labels
  - payslips KO aria labels (list/compare/sheet/search-sort)
- Guard blocks accidental KO-to-English regressions in these high-priority surfaces.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0587-korean-surface-one-shot-guard-withholding-payslips-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0586-employee-contract-response-history-status-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0585-employee-contract-response-history-filter.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0584-employee-contract-response-history-panel.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0583-employee-contract-hash-copy-actions.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0582-employee-contract-evidence-metadata-copy-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0581-employee-contract-signature-input-guard.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0580-employee-contract-inbox-journey-refinement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
