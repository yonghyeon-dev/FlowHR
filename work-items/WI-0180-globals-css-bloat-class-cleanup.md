# WI-0180: Globals CSS Bloat Class Cleanup

## Background and Problem

`src/app/globals.css` had accumulated many phase-loop selectors tied to removed UI sections (`hardening`, `delay-risk`, `mobile-follow-up-*`).
After WI-0176~WI-0179 removed those sections from pages, related CSS remained as dead weight and made style maintenance harder.

Following `docs/codex-guide.md` Phase C, WI-0180 removes bloat selector families from `globals.css`.

## Scope

### In Scope

- Remove dead selector families in `src/app/globals.css` tied to removed phase-loop sections:
  - history sort hardening/execution/digest selectors
  - delay-risk prediction/response/backlog selectors
  - evidence/SLA/mobile review/checklist selectors
  - mobile follow-up recommendation-upgrade selectors
  - employee insight/bottleneck prediction selectors removed by WI-0176
  - admin people phase-loop selectors removed by WI-0179
  - payslip phase-loop selectors removed by WI-0178
- Keep core selectors used by current MVP screens intact
- Add WI-0180 regression test:
  - `scripts/tests/e2e-wi0180-globals-css-bloat-class-cleanup.test.ts`
- Add WI-0180 test to MVP/FULL e2e chains in `package.json`

### Out of Scope

- Deprecated WI/test archival (`WI-0181`)
- Additional UI feature development

## User Scenarios

1. Core pages render with existing styles after bloat cleanup.
2. Removed phase-loop sections do not carry stale CSS baggage.
3. CSS file-size growth is constrained by regression checks.

## Data and API Changes

- None

## Rollback Plan

- Restore removed selectors in `src/app/globals.css`
- Revert `scripts/tests/e2e-wi0180-globals-css-bloat-class-cleanup.test.ts`
- Revert `package.json` e2e chain updates

## Definition of Done (DoD)

- [x] Bloat selector tokens listed for WI-0180 are removed from `globals.css`.
- [x] Core selectors for active pages remain in `globals.css`.
- [x] WI-0180 regression test exists and is wired into MVP/FULL suites.
