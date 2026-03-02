# WI-0793 Employee Payslips Admin Shortcut Devtools Gate

## Background

- Employee payslips filter panel still exposed a direct `/admin` shortcut in product mode.
- This created the same employee/admin boundary leak already addressed on the employee dashboard (WI-0792).

## Scope

- Gate `/admin` shortcut in `src/app/employee/payslips/page-view-filter-panel.tsx` by `showDevTools`.
- Keep admin shortcut visible in devtools mode only, with explicit dev-only label.
- Add WI-0793 regression guard and roadmap traceability update.

## Acceptance Criteria

1. Employee payslips filter panel does not show plain admin shortcut in product mode.
2. Devtools mode still exposes admin shortcut with dev-only labeling.
3. Regression test and roadmap/work-item links are updated.

## Notes

- UI navigation boundary hardening only.
- No API/schema/permission changes.
