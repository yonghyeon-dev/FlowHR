# WI-0179: Admin People Bloat Section Removal

## Background and Problem

`src/app/admin/people/page.tsx` had expanded with repeated phase-loop sections (`history-sort-*`, `delay-risk-*`, `mobile-follow-up-*`).
This created large-file maintenance risk and roadmap drift without improving the core admin people journey.

Following `docs/codex-guide.md` Phase A/B, WI-0179 removes bloated admin-people sections and related test-chain dependencies.

## Scope

### In Scope

- Remove bloated sections from `src/app/admin/people/page.tsx`:
  - history search/sort hardening/execution/digest panels
  - delay-risk prediction/response/execution panels
  - mobile follow-up/recommendation-upgrade panels
- Remove corresponding state/action/useMemo helpers in `src/app/admin/people/page.tsx`
- Keep only core sections:
  - `directory-filters`, `org-chart`, `employee-compare`, `employee-history`
- Reduce admin people page budget in `qa/page-size-budget.json`
- Add WI-0179 regression test:
  - `scripts/tests/e2e-wi0179-admin-people-bloat-section-removal.test.ts`
- Update e2e suite wiring in `package.json`:
  - remove admin-people phase-loop tests tied to removed sections
  - add WI-0179 regression test in MVP/FULL suites

### Out of Scope

- Admin people CSS dead-class sweep (`WI-0180`)
- Deprecated WI/test archival (`WI-0181`)
- New admin people feature expansion

## User Scenarios

1. Admin people page no longer exposes looped hardening/digest/mobile-follow-up sections.
2. Core org chart/compare/history workflow remains usable.
3. Page-size guard enforces reduced line budget to prevent regressions.

## Data and API Changes

- None

## Rollback Plan

- Restore removed people sections/helpers in `src/app/admin/people/page.tsx`
- Restore removed admin-people phase tests in `package.json`
- Revert `qa/page-size-budget.json` people budget
- Revert WI-0179 regression test and work-item file

## Definition of Done (DoD)

- [x] All WI-0179 removal target section IDs are gone from admin people page.
- [x] Admin people page line count is reduced under new budget (`maxLines: 2200`).
- [x] WI-0179 regression test exists and is wired into MVP/FULL suites.
