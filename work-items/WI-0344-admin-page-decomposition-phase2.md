# WI-0344: Admin page decomposition phase2

## Summary
- Split admin queue-derived summary logic out of `admin/page.tsx` into queue helpers.
- Centralized API-log summary and queue badge/alert overview builders.
- Reduced inline page complexity while preserving queue behavior.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-queue-helpers.ts`
- `scripts/tests/e2e-wi0344-admin-page-decomposition-phase2.test.ts` (new)
- `ROADMAP.md`

## Notes
- UI/derived-logic refactor only; no contract changes.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0344-admin-page-decomposition-phase2.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0298-admin-page-decomposition-phase1.test.ts`
- `npm.cmd run -s typecheck`
