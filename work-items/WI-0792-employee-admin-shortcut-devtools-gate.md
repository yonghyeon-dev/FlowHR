# WI-0792 Employee Admin Shortcut Devtools Gate

## Background

- Employee dashboard top actions still exposed a direct `/admin` shortcut in product mode.
- This mixed employee UX with admin-console navigation and conflicted with the product-facing information architecture.

## Scope

- Gate employee dashboard admin shortcut by `showDevTools` in `EmployeeDashboardChrome`.
- Keep `/admin` and `/ops/mvp-console` shortcuts available only in devtools mode.
- Update shortcut copy to clearly indicate dev-only intent.
- Add WI-0792 regression guard and roadmap traceability update.

## Acceptance Criteria

1. Employee dashboard top actions do not show plain admin shortcut in product mode.
2. Devtools mode still exposes admin and ops shortcuts.
3. Regression test and roadmap/work-item links are updated.

## Notes

- UI surface hardening only.
- No API/schema/permission changes.
