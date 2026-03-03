# WI-0809 Employee Notices Admin Link Devtools Gate

## Summary
- Hide `/employee/notices` admin shortcut in product mode.
- Expose `/admin/notices` shortcut only when `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` is enabled.

## Scope
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `scripts/tests/e2e-wi0809-employee-notices-admin-link-devtools-gate.test.ts`
- `ROADMAP.md`

## Implementation Notes
- Converted the admin shortcut to a devtools-only conditional render:
  - `showDevTools ? <Link ... href="/admin/notices">DEV /admin/notices</Link> : null`
- Kept employee workspace shortcut (`/employee`) visible in all modes.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0809-employee-notices-admin-link-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0808-employee-notices-initial-auto-load.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0710-employee-session-context-devtools-gate-core-workspaces.test.ts`

## Risks
- UI-only change with no API/contract impact.
