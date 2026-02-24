# WI-0313: Admin Page Decomposition Phase 3 (Locale Label Helpers)

## Background

`src/app/admin/page.tsx` still contains inline locale label maps and demo
organization-name fallback logic. These blocks are stable helper concerns and
can be separated to reduce page size and improve readability.

## Scope

- Add `src/app/admin/page-locale-helpers.ts` for:
  - locale label bundle resolution
  - default demo organization-name detection
- Rewire `src/app/admin/page.tsx` to consume helper bundle.
- Add WI-0313 regression test coverage.

## Out of Scope

- New UI features
- API/schema/contract changes
- Admin flow behavior changes

## Acceptance

1. `admin/page.tsx` uses locale label helper module instead of inline
   label-map `useMemo` blocks.
2. Locale behavior remains unchanged for `ko`/`en`.
3. WI-0313 regression and build checks pass.

## Notes

- Related issue: `#395`
- Page decomposition WI (UI structure cleanup only)
