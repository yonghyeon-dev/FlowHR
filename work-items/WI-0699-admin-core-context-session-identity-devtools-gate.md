# WI-0699 Admin Core Context Session Identity Devtools Gate

## Summary
- gated read-only session identity metadata (`organizationId`, `actorId`) behind
  `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` on core admin context panels:
  - `src/components/admin-attendance-live/AdminAttendanceLiveSections.tsx`
  - `src/components/admin-onboarding/AdminOnboardingSections.tsx`
  - `src/components/admin-kpi/AdminKpiSections.tsx`
- propagated `showDevTools` wiring through dashboards so context panels receive
  runtime flag state:
  - `src/components/admin-attendance-live/AdminAttendanceLiveDashboard.tsx`
  - `src/components/admin-onboarding/AdminOnboardingDashboard.tsx`
  - `src/components/admin-kpi/AdminKpiDashboard.tsx`
- exposed `showDevTools` from onboarding data hook for dashboard-level panel
  control:
  - `src/components/admin-onboarding/useAdminOnboardingData.ts`

## Scope
- core admin UI exposure control only
- no API/schema/contract changes
- no ops route changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0699-admin-core-context-session-identity-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0622-admin-workspaces-session-context-productization.test.ts`
- `npm.cmd run typecheck`
