# WI-0412: Admin Dashboard Actions and Compensation Panels Extraction

## Summary
- Goal: reduce `src/app/admin/page.tsx` orchestration complexity and isolate high-churn action/panel logic.
- Change:
  - Extracted dashboard action orchestration from `src/app/admin/page.tsx` to:
    - `src/app/admin/page-dashboard-actions.ts`
    - scope: inbox refresh, payroll preview/confirm, leave policy load/save, accrual settle, attendance aggregate list, dashboard refresh, debug logs clear.
  - Extracted compensation section composition from `src/app/admin/page.tsx` to:
    - `src/app/admin/page-compensation-panels.tsx`
    - scope: aggregate/leave panel, payroll panel, debug logs panel wiring.
  - Kept existing panel ids and behavior contracts to avoid regressions in prior admin decomposition tests.
- Outcome:
  - Admin page became thinner (action logic + compensation panel wiring removed from root page).
  - Build and existing admin decomposition regressions remain green.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-dashboard-actions.ts`
- `src/app/admin/page-compensation-panels.tsx`
- `scripts/tests/e2e-wi0412-admin-dashboard-action-compensation-panel-extraction.test.ts`
- `work-items/WI-0412-admin-dashboard-actions-and-compensation-panels-extraction.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0298-admin-page-decomposition-phase1.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0344-admin-page-decomposition-phase2.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0374-admin-runtime-locale-and-api-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0382-admin-queue-derived-helper-consolidation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0388-admin-directory-action-orchestrator-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0412-admin-dashboard-action-compensation-panel-extraction.test.ts`
- `npm.cmd run -s build`
