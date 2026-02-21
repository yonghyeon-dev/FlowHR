# Frontend Guardrails

## Why

Large monolithic route files slow down delivery, increase merge conflicts, and hide regressions.
FlowHR uses page-size guardrails to stop single-file growth and force componentized changes.

## Rules

1. Do not add new `phase N+1` sections into already overgrown pages.
2. Build new UX in isolated routes/components first, then link from existing dashboards.
3. Every `src/app/**/page.tsx` must respect page-size budgets in `qa/page-size-budget.json`.
4. Existing oversized pages are tracked with freeze budgets (`maxLines`) and reduction targets (`targetLines`).
5. If a change needs a large new UI block, extract to dedicated component files instead of appending to route files.

## Enforcement

- Automated check: `npm run test:architecture`
- Included in:
  - `npm run test:e2e:mvp`
  - `npm run test:e2e:full`

## Current Priority

1. Freeze growth in tracked monolith pages.
2. Reduce tracked pages toward `targetLines`.
3. Move roadmap progress to not-yet-started product areas via new, isolated routes.
