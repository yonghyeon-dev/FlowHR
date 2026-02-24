# WI-0354: Admin onboarding locale dynamic UI gap fix

## Summary
- Removed remaining hardcoded English labels from `/admin/onboarding` setup/checklist surfaces.
- Added locale-aware status tokens (`done/todo`, `ok/fail`) and leave-policy field labels to copy.
- Localized API log request labels by passing locale request-copy into the onboarding data hook.

## Scope
- `src/components/admin-onboarding/copy.ts`
- `src/components/admin-onboarding/AdminOnboardingDashboard.tsx`
- `src/components/admin-onboarding/AdminOnboardingSections.tsx`
- `src/components/admin-onboarding/useAdminOnboardingData.ts`
- `scripts/tests/e2e-wi0354-admin-onboarding-locale-dynamic-ui-gap-fix.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0354-admin-onboarding-locale-dynamic-ui-gap-fix.test.ts`
