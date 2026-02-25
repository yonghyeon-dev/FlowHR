# WI-0399: Notice/Benefits/Recruitment Baseline Routes and Nav i18n Wiring

## Summary
- Opened baseline routes for previously stalled domains: notices, benefits, and recruitment.
- Added admin routes: `/admin/notices`, `/admin/benefits`, `/admin/recruitment`.
- Added employee routes: `/employee/benefits`, `/employee/recruitment`.
- Wired both admin and employee navigation to the new routes.
- Added ko/en i18n keys so navigation labels follow runtime locale.

## Scope
- `src/app/admin/notices/page.tsx`
- `src/app/admin/benefits/page.tsx`
- `src/app/admin/recruitment/page.tsx`
- `src/app/employee/benefits/page.tsx`
- `src/app/employee/recruitment/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/employee/layout.tsx`
- `src/lib/i18n/messages.ts`
- `scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- `ROADMAP.md`
- `package.json`

## Validation
- `npm.cmd run -s typecheck`
- `npm.cmd exec tsx scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0398-payslip-page-view-decomposition-and-render-orchestrator-split.test.ts`
- `npm.cmd exec tsx scripts/tests/page-composition-guard.test.ts`
