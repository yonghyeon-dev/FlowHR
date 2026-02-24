# WI-0361: Admin attendance live locale residual cleanup

## Summary
- Removed hardcoded English table headers and log badges in `/admin/attendance-live`.
- Added locale copy keys for attendance table header labels and log success/fail badges.
- Localized Korean context labels for organization/admin/access token fields.

## Scope
- `src/components/admin-attendance-live/copy.ts`
- `src/components/admin-attendance-live/AdminAttendanceLiveSections.tsx`
- `scripts/tests/e2e-wi0361-admin-attendance-live-locale-residual-cleanup.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0361-admin-attendance-live-locale-residual-cleanup.test.ts`

