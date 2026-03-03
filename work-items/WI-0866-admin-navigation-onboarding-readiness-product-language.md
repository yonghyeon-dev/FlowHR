# WI-0866 Admin Navigation / Onboarding Readiness Product Language

## Summary
- Refined admin information architecture in layout navigation so core routes do not duplicate identical href keys.
- Strengthened onboarding readiness panel with workspace-specific deep links and per-item quick action buttons.
- Normalized user-facing language by replacing dev-centric `query` wording with product terms (`search`, `filters`) in core admin leave/approval surfaces.

## Scope
- `src/app/admin/layout.tsx`
- `src/components/admin-onboarding/AdminOnboardingReadinessPanel.tsx`
- `src/components/admin-approval/ApprovalQueuePanel.tsx`
- `src/components/admin-approval/ApprovalQueueSearchSortPanel.tsx`
- `src/components/leave-calendar/copy.ts`
- `scripts/tests/e2e-wi0866-admin-navigation-onboarding-readiness-product-language.test.ts` (new)

## Acceptance
1. Admin layout navigation no longer repeats identical `href` values that caused key-collision risk in sidebar/mobile rendering.
2. Attendance/leave/payroll multi-label entries remain available with unique route contexts.
3. Onboarding readiness pending checklist rows provide direct workspace links (`people`, `leave-accrual`, `contracts`) instead of only `/admin/onboarding`.
4. Onboarding readiness pending checklist rows expose quick-run action buttons for actionable items.
5. Approval queue English copy uses `search` terminology instead of `query`.
6. Leave calendar English filter panel uses `filters` and `results` terminology instead of `query`.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0866-admin-navigation-onboarding-readiness-product-language.test.ts`
- `npm.cmd run build`
