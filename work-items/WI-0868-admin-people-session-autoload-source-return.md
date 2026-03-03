# WI-0868 Admin People Session Auto-Load + Source Return

## Summary
- Added one-shot session-ready auto-load in `/admin/people` so directory data is fetched without requiring manual refresh.
- Added selected-employee history auto-sync so deep-link employee context and history-limit changes hydrate history automatically.
- Added onboarding source-context propagation and source-return action so admin onboarding handoff into `/admin/people` can return to the originating workspace.

## Scope
- `src/app/admin/people/page.tsx`
- `src/app/admin/people/page-view.tsx`
- `src/app/admin/people/page-view-org-chart-panel.tsx`
- `src/components/admin-onboarding/AdminOnboardingReadinessPanel.tsx`
- `scripts/tests/e2e-wi0868-admin-people-session-autoload-source-return.test.ts` (new)

## Acceptance
1. `/admin/people` auto-runs directory refresh once when session context is ready (except production runtime without bearer session).
2. `/admin/people` auto-loads selected employee history when selected employee or history limit changes.
3. Org chart employee selection updates selected employee state without duplicate immediate history fetch calls from the button layer.
4. Onboarding readiness workspace links to `/admin/people` include `source=admin-onboarding` context.
5. `/admin/people` header shows source-return action (`Back to onboarding` / `Back to dashboard`) when source context exists.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0868-admin-people-session-autoload-source-return.test.ts`
- `npm.cmd run build`
