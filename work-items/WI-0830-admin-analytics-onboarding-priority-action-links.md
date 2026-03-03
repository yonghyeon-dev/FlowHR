# WI-0830 Admin Analytics Onboarding Priority Action Links

## Summary
- Added priority-action decision logic to the admin analytics onboarding KPI panel.
- Added quick action links for onboarding workspace, pending contract response queue, and people workspace.
- Extended onboarding analytics copy keys (ko/en) for action labels and priority reasons.

## Scope
- `src/components/admin-kpi/AdminOnboardingKpiPanel.tsx`
- `src/components/admin-kpi/copy.ts`
- `scripts/tests/e2e-wi0830-admin-analytics-onboarding-priority-action-links.test.ts` (new)

## Acceptance
1. Onboarding KPI panel shows top-priority action based on pending contract responses, pending invites, and readiness score.
2. Onboarding KPI panel exposes quick links to onboarding/contracts/people workspaces.
3. Onboarding priority action labels/reasons are localized for ko/en.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0830-admin-analytics-onboarding-priority-action-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0796-admin-analytics-onboarding-kpi-panel.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
