# WI-0177: Admin Dashboard Bloat Section Removal

## Background and Problem

`src/app/admin/page.tsx` had grown to ~7,000 lines due to repeated approval-queue phase sections (`hardening`, `execution-summary`, `mobile-follow-up-upgrade-*`).
This created maintenance overhead and repeated UX loops instead of moving roadmap scope.

Following `docs/codex-guide.md` Phase A/B, WI-0177 removes bloated admin-only sections and related navigation anchors.

## Scope

### In Scope

- Remove bloated sections from `src/app/admin/page.tsx`:
  - approval history sort hardening/execution/digest panels
  - evidence/SLA/prediction panels
  - delay-risk response/execution panels
  - mobile review/checklist/follow-up recommendation panels
  - bulk validation/item history/mobile feedback panels
- Remove corresponding state/action/useMemo helpers in `src/app/admin/page.tsx`
- Trim `src/app/admin/layout.tsx` navigation to core anchors only
- Reduce admin page budget in `qa/page-size-budget.json`
- Add WI-0177 regression test:
  - `scripts/tests/e2e-wi0177-admin-dashboard-bloat-section-removal.test.ts`
- Update e2e suite wiring in `package.json`:
  - remove admin phase-loop tests tied to removed sections
  - add WI-0177 regression test in MVP/FULL suites

### Out of Scope

- Employee payslips cleanup (`WI-0178`)
- Admin people cleanup (`WI-0179`)
- `globals.css` bloat class sweep (`WI-0180`)
- Deprecated WI/test archival (`WI-0181`)

## User Scenarios

1. Admin page no longer exposes looped hardening/digest/mobile-follow-up sections.
2. Admin sidebar keeps only core workflow anchors.
3. Page-size guard enforces reduced line budget to prevent regressions.

## Data and API Changes

- None

## Rollback Plan

- Restore removed admin sections/helpers in `src/app/admin/page.tsx`
- Restore removed sidebar anchors in `src/app/admin/layout.tsx`
- Revert `qa/page-size-budget.json` admin budget
- Revert `package.json` e2e wiring and WI-0177 regression test file

## Definition of Done (DoD)

- [x] All WI-0177 removal target section IDs are gone from admin page/layout.
- [x] Admin page line count is reduced under new budget (`maxLines: 3000`).
- [x] WI-0177 regression test exists and is wired into MVP/FULL suites.
