# WI-0824 Admin Analytics Recruitment KPI Priority Action Links

## Summary
- Extended `/admin/analytics` recruitment KPI panel with top-priority action resolution based on queue risk (`stalled -> active -> openings -> clear`).
- Added direct action links from KPI panel to `/admin/recruitment` deep links (`risk=stalled_7d`, `stage=SUBMITTED`) for faster triage handoff.
- Added localized (ko/en) priority reason and quick action copy for recruitment operations.

## Scope
- `src/components/admin-kpi/AdminRecruitmentKpiPanel.tsx`
- `src/components/admin-kpi/copy.ts`
- `scripts/tests/e2e-wi0824-admin-analytics-recruitment-priority-action-links.test.ts` (new)

## Acceptance
1. Recruitment KPI panel shows top-priority action reason and CTA in `/admin/analytics`.
2. Priority CTA resolves to stalled queue first, then recruitment workspace fallbacks.
3. Quick actions expose recruitment workspace, stalled queue, and submitted queue links.
4. Korean/English runtime copy includes recruitment priority-action labels/reasons.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0824-admin-analytics-recruitment-priority-action-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0763-admin-analytics-recruitment-kpi-panel.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
