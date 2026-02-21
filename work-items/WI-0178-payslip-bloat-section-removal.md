# WI-0178: Payslip Page Bloat Section Removal

## Background and Problem

`src/app/employee/payslips/page.tsx` had expanded with repeated phase-loop sections (`history-sort-*`, `delay-risk-*`, `mobile-follow-up-*`).
This created large-file maintenance risk and roadmap drift without improving core employee payslip journey.

Following `docs/codex-guide.md` Phase A/B, WI-0178 removes bloated payslip-only sections and related navigation anchors.

## Scope

### In Scope

- Remove bloated sections from `src/app/employee/payslips/page.tsx`:
  - history sort hardening/execution/digest panels
  - confirmation/delay risk prediction-response-execution panels
  - mobile delivery/follow-up/recommendation-upgrade panels
- Remove corresponding state/action/useMemo helpers in `src/app/employee/payslips/page.tsx`
- Trim `src/app/employee/layout.tsx` payslip navigation to core anchors only
- Reduce payslip page budget in `qa/page-size-budget.json`
- Add WI-0178 regression test:
  - `scripts/tests/e2e-wi0178-payslip-bloat-section-removal.test.ts`
- Update e2e suite wiring in `package.json`:
  - remove payslip phase-loop tests tied to removed sections
  - add WI-0178 regression test in MVP/FULL suites

### Out of Scope

- Admin people cleanup (`WI-0179`)
- `globals.css` bloat class sweep (`WI-0180`)
- Deprecated WI/test archival (`WI-0181`)

## User Scenarios

1. Payslip page no longer exposes looped hardening/digest/mobile-follow-up sections.
2. Employee sidebar keeps only core payslip anchors.
3. Page-size guard enforces reduced line budget to prevent regressions.

## Data and API Changes

- None

## Rollback Plan

- Restore removed payslip sections/helpers in `src/app/employee/payslips/page.tsx`
- Restore removed payslip anchors in `src/app/employee/layout.tsx`
- Revert `qa/page-size-budget.json` payslip budget
- Revert `package.json` e2e wiring and WI-0178 regression test file

## Definition of Done (DoD)

- [x] All WI-0178 removal target section IDs are gone from payslip page/layout.
- [x] Payslip page line count is reduced under new budget (`maxLines: 3000`).
- [x] WI-0178 regression test exists and is wired into MVP/FULL suites.
