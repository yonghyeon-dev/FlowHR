# WI-0360: Admin KPI locale residual cleanup

## Summary
- Removed remaining hardcoded English strings in `/admin/kpi` table/log surfaces.
- Added locale copy keys for trend table metric header and API log success/fail badge text.
- Localized Korean context labels for organization/admin/access token fields.

## Scope
- `src/components/admin-kpi/copy.ts`
- `src/components/admin-kpi/AdminKpiSections.tsx`
- `scripts/tests/e2e-wi0360-admin-kpi-locale-residual-cleanup.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0360-admin-kpi-locale-residual-cleanup.test.ts`

