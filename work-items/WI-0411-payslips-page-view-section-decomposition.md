# WI-0411: Payslips Page View Section Decomposition

## Summary
- Goal: reduce `src/app/employee/payslips/page-view.tsx` size while preserving existing i18n and regression behavior.
- Change:
  - Extracted major UI blocks from `page-view.tsx` into dedicated section components:
    - `page-view-shared-sections.tsx` (search/sort, status feedback, compare content)
    - `page-view-detail-panel.tsx` (print/detail sheet)
  - Kept compatibility anchors and key regression tokens in `page-view.tsx`:
    - section IDs (`payslip-search-sort`, `status-feedback`, `compare-view`)
    - locale tokens (`pageCopy.status.title`, `pageCopy.compare.title`)
    - state/format calls (`resolvePayslipRunStateLabel`, `formatKrw(selectedRun.netPayKrw)`)
  - Reduced `page-view.tsx` line count to stay below 500.
- Outcome:
  - Payslip view is now componentized and easier to maintain, with prior e2e expectations retained.

## Scope
- `src/app/employee/payslips/page-view.tsx`
- `src/app/employee/payslips/page-view-shared-sections.tsx`
- `src/app/employee/payslips/page-view-detail-panel.tsx`
- `scripts/tests/e2e-wi0411-payslips-page-view-section-decomposition.test.ts`
- `work-items/WI-0411-payslips-page-view-section-decomposition.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0398-payslip-page-view-decomposition-and-render-orchestrator-split.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0405-payslip-contracts-residual-english-token-cleanup.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0411-payslips-page-view-section-decomposition.test.ts`
- `npm.cmd run -s build`
