# WI-0373: Admin/employee account panels locale residual cleanup

## Summary
- Fixed remaining hardcoded locale strings in account/onboarding panels for admin and employee surfaces.
- Converted session error prefix, organization ID placeholder, and organization list `aria-label` to locale-aware (`ko`/`en`) rendering.
- Preserved existing UX while removing mixed-language fallback behavior.

## Scope
- `src/components/admin-dashboard/AdminOnboardingAccountPanels.tsx`
- `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- `scripts/tests/e2e-wi0373-admin-employee-account-panels-locale-residual-cleanup.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0373-admin-employee-account-panels-locale-residual-cleanup.test.ts`
- `npm.cmd run -s typecheck`
