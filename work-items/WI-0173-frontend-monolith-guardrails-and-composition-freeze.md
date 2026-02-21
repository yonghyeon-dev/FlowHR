# WI-0173: Frontend Monolith Guardrails and Composition Freeze

## Background and Problem

FlowHR core route files have grown beyond maintainable size:

- `src/app/admin/page.tsx`: 6,984 lines
- `src/app/employee/page.tsx`: 5,828 lines
- `src/app/employee/payslips/page.tsx`: 4,648 lines
- `src/app/admin/people/page.tsx`: 3,930 lines

Recent work repeatedly appended `phase N+1` blocks to the same pages, creating a loop of expanding complexity.
This blocks safe refactoring and slows roadmap progress.

## Scope

### In Scope

- Add page-size budget config: `qa/page-size-budget.json`
  - default `page.tsx` max lines
  - tracked oversized pages with freeze max and reduction targets
- Add architecture guard test: `scripts/tests/page-composition-guard.test.ts`
  - fail when any page exceeds budget
  - fail when tracked pages are missing from repo
  - print top page-size summary for visibility
- Wire guard into e2e entrypoints:
  - `test:e2e:mvp`
  - `test:e2e:full`
  - standalone `test:architecture`
- Document frontend guardrails: `docs/frontend-guardrails.md`

### Out of Scope

- Splitting existing large pages in this WI
- New API/database changes
- New scheduler/cron/workflow additions

## User Scenarios

1. Maintainer adds UI work and immediately fails CI if a page exceeds size budget.
2. Maintainer can see which monolith pages are frozen and what target size must be reached.
3. Team can move roadmap work to new isolated routes/components instead of appending to monolith pages.

## Data and API Changes

- None

## Rollback Plan

- Remove `page-composition-guard.test.ts` and `qa/page-size-budget.json`.
- Remove `test:architecture` script and e2e pre-check prefixes from `package.json`.
- Remove `docs/frontend-guardrails.md`.

## Definition of Done (DoD)

- [x] Page-size budget file exists and includes tracked monolith pages.
- [x] Guard test enforces budgets and prints summary.
- [x] `test:e2e:mvp` and `test:e2e:full` run guard before e2e suite.
- [x] Frontend guardrail policy is documented.
