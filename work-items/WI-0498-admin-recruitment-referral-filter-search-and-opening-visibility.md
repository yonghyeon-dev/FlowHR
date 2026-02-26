# WI-0498: Admin Recruitment Referral Filter/Search and Opening Visibility

## Summary
- Goal: improve admin hiring triage in `/admin/recruitment` by adding referral filter/search and showing opening titles in referral rows.
- Scope:
  - `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
  - `src/components/recruitment/AdminRecruitmentWorkspaceView.tsx`
  - `src/components/recruitment/copy.ts`
  - `scripts/tests/e2e-wi0498-admin-recruitment-referral-filter-search-and-opening-visibility.test.ts`
  - `ROADMAP.md`

## Delivery
- Added referral queue controls in admin recruitment workspace:
  - stage filter (`all`, `SUBMITTED`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`, `WITHDRAWN`)
  - search by candidate name/email, referrer employee ID, opening title, and note
  - visible/total count summary and filtered-empty guidance
- Added opening-title visibility per referral row using openingId-to-title mapping with locale fallback.
- Kept line-budget guardrail:
  - `AdminRecruitmentWorkspace.tsx` remains <= 300 lines.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0409-recruitment-core-journey-implementation.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0475-admin-recruitment-workspace-view-decomposition.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0476-admin-non-payroll-workspace-line-budget-guard.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0498-admin-recruitment-referral-filter-search-and-opening-visibility.test.ts`
- [x] `npm.cmd run typecheck`
