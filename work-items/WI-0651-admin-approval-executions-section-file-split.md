# WI-0651 Admin Approval Executions Section File Split

## Summary
- split `src/app/admin/approval-executions/page-sections.tsx` into focused section files:
  - `src/app/admin/approval-executions/page-sections-work-conditions.tsx`
  - `src/app/admin/approval-executions/page-sections-summary-escalation.tsx`
  - `src/app/admin/approval-executions/page-sections-queue.tsx`
- converted `src/app/admin/approval-executions/page-sections.tsx` into a barrel export module
- kept behavior unchanged while aligning each section file to line-budget-friendly size (< 300 lines)
- updated existing approval-executions regression tests to read the split section surface
- added WI-0651 regression guard for section split and per-file line limits

## Scope
- admin approval-executions UI module organization only
- no API/schema/contract changes
- no behavior changes intended

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0626-admin-approval-pages-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0643-admin-approval-executions-product-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0649-admin-approval-executions-line-budget-decomposition.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0651-admin-approval-executions-section-file-split.test.ts`
- `npm.cmd run typecheck`
