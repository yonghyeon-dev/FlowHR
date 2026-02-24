# WI-0382: Admin queue derived helper consolidation

## Summary
- Consolidated admin approval-queue derived state computation into `buildAdminQueueDerivedState` in `page-queue-helpers.ts`.
- Replaced the large inline `useMemo` chain in `src/app/admin/page.tsx` with a single memoized helper call.
- Preserved queue filtering/search/sort/SLA alert behavior while reducing `admin/page.tsx` size.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-queue-helpers.ts`
- `scripts/tests/e2e-wi0382-admin-queue-derived-helper-consolidation.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0382-admin-queue-derived-helper-consolidation.test.ts`
- `npm.cmd run -s typecheck`
