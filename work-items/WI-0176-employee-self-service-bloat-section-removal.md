# WI-0176: Employee Self-Service Bloat Section Removal

## Background and Problem

`src/app/employee/page.tsx` had expanded to 5,800+ lines with repeated phase-style sections (`hardening`, `execution-summary`, `upgrade-*`).
This reduced maintainability and caused repeated UX loops instead of progressing roadmap scope.

Following `docs/codex-guide.md` Phase A/B, WI-0176 removes bloated employee-only sections and related navigation anchors first.

## Scope

### In Scope

- Remove bloated sections from `src/app/employee/page.tsx`:
  - request history hardening/execution/digest panels
  - approval delay risk prediction/response/execution panels
  - mobile shortcut/status/follow-up recommendation panels
  - attendance/leave insight panels
- Remove corresponding action handlers/useMemo blocks in `src/app/employee/page.tsx`
- Trim `src/app/employee/layout.tsx` navigation to core anchors only
- Reduce employee page budget in `qa/page-size-budget.json`
- Add WI-0176 regression test:
  - `scripts/tests/e2e-wi0176-employee-self-service-bloat-section-removal.test.ts`
- Update e2e suite wiring in `package.json`:
  - remove employee phase-loop tests tied to removed sections
  - add WI-0176 regression test in MVP/FULL suites

### Out of Scope

- Admin page cleanup (`WI-0177`)
- Payslip page cleanup (`WI-0178`)
- Admin people page cleanup (`WI-0179`)
- `globals.css` sweep (`WI-0180`)

## User Scenarios

1. Employee page no longer exposes looped hardening/digest mobile-follow-up sections.
2. Employee sidebar only keeps core workflow anchors.
3. Page-size guard enforces the reduced size ceiling to prevent regressions.

## Data and API Changes

- None

## Rollback Plan

- Restore removed employee sections/handlers in `src/app/employee/page.tsx`
- Restore removed sidebar anchors in `src/app/employee/layout.tsx`
- Revert `qa/page-size-budget.json` employee budget
- Revert `package.json` e2e wiring and WI-0176 regression test file

## Definition of Done (DoD)

- [x] All WI-0176 removal target section IDs are gone from employee page/layout.
- [x] Employee page line count is reduced under new budget (`maxLines: 3000`).
- [x] WI-0176 regression test exists and is wired into MVP/FULL suites.
