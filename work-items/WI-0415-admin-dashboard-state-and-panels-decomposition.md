# WI-0415: Admin Dashboard State and Panels Decomposition

## Summary
- Goal: reduce `src/app/admin/page.tsx` size below the page budget and isolate state/render responsibilities.
- Change:
  - `src/app/admin/page-state.ts`
    - Moved admin dashboard state/effects/share-context handling into `useAdminDashboardState`.
  - `src/app/admin/page-panels.tsx`
    - Extracted panel rendering/wiring (`onboarding`, `people+invite`, `scheduling`, `approval queue`, `compensation`) from main page.
  - `src/app/admin/page.tsx`
    - Kept orchestration concerns only (session, queue derived state, API call wiring, action builders, dashboard chrome).
    - Replaced inline panel grid with `<AdminDashboardPanels ... />`.
- Outcome:
  - `src/app/admin/page.tsx` now stays under 500 lines.
  - Admin state and panel rendering concerns are explicitly separated for further targeted decomposition.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-state.ts`
- `src/app/admin/page-panels.tsx`
- `scripts/tests/e2e-wi0415-admin-dashboard-state-and-panels-decomposition.test.ts`
- `work-items/WI-0415-admin-dashboard-state-and-panels-decomposition.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0305-admin-employee-page-decomposition-phase2.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0344-admin-page-decomposition-phase2.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0412-admin-dashboard-action-compensation-panel-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0415-admin-dashboard-state-and-panels-decomposition.test.ts`
- `npm.cmd exec tsc -- --noEmit`
- `npm.cmd run -s build`
