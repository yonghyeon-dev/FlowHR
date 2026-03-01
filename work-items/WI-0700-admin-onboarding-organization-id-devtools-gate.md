# WI-0700 Admin Onboarding Organization-ID Devtools Gate

## Summary
- hid onboarding organization identifier exposure in product mode and limited it
  to `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` mode:
  - `src/components/admin-onboarding/AdminOnboardingSections.tsx`
    - organization-id summary row in setup panel is now devtools-only
    - organization list now shows name only by default; id suffix is devtools-only
- propagated devtools flag to setup panel wiring:
  - `src/components/admin-onboarding/AdminOnboardingDashboard.tsx`

## Scope
- admin onboarding UI exposure control only
- no API/schema/contract changes
- no behavior change in onboarding actions

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0622-admin-workspaces-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0699-admin-core-context-session-identity-devtools-gate.test.ts`
- `npm.cmd run typecheck`
